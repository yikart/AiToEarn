import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { UserType } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import { execa } from 'execa'
import { z } from 'zod'
import { ChatService } from '../../ai/chat'
import { McpServerName } from '../agent.constants'
import { successResult, wrapTool } from './mcp.utils'

const generateSubtitleSchema = z.object({
  mediaUrl: z.string().describe('Video or audio URL to transcribe'),
  language: z.string().optional().describe('Target language code, e.g., "zh-CN", "en-US"'),
})

export enum SubtitleToolName {
  GenerateSubtitle = 'generateSubtitle',
}

interface SubtitleEntry {
  index: number
  startTime: number
  endTime: number
  text: string
}

@Injectable()
export class SubtitleMcp {
  private readonly logger = new Logger(SubtitleMcp.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly assetsService: AssetsService,
  ) {}

  /**
   * 使用 FFmpeg 从 URL 提取音频
   */
  private async extractAudioWithFFmpeg(mediaUrl: string): Promise<Buffer> {
    const tempDir = os.tmpdir()
    const outputPath = path.join(tempDir, `audio-${Date.now()}.aac`)

    try {
      await execa('ffmpeg', [
        '-i',
        mediaUrl,
        '-vn',
        '-acodec',
        'aac',
        '-b:a',
        '128k',
        '-y',
        outputPath,
      ])

      return fs.readFileSync(outputPath)
    }
    finally {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
    }
  }

  /**
   * 构建字幕转录提示词
   */
  private buildSubtitlePrompt(language?: string): string {
    const targetLang = language || 'the original spoken language'
    return `Transcribe this audio to ${targetLang} with precise timestamps.

Requirements:
1. Each subtitle entry should be 1-2 sentences, max 2 lines
2. Timestamps must be accurate to the audio (in milliseconds)
3. Use proper punctuation
4. Return a JSON object with an "entries" array

Each entry must have:
- index: number (starting from 1)
- startTime: number (milliseconds)
- endTime: number (milliseconds)
- text: string (subtitle text)

Example output format:
{
  "entries": [
    { "index": 1, "startTime": 0, "endTime": 2500, "text": "Hello, welcome to our video." },
    { "index": 2, "startTime": 2600, "endTime": 5000, "text": "Today we will discuss..." }
  ]
}`
  }

  /**
   * 将毫秒转换为 SRT 时间格式 (HH:MM:SS,mmm)
   */
  private formatSrtTime(ms: number): string {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
  }

  /**
   * 从结构化数据生成 SRT 格式字幕
   */
  private generateSrtFromEntries(entries: SubtitleEntry[]): string {
    return entries.map((entry) => {
      const startTime = this.formatSrtTime(entry.startTime)
      const endTime = this.formatSrtTime(entry.endTime)
      return `${entry.index}\n${startTime} --> ${endTime}\n${entry.text}\n`
    }).join('\n')
  }

  createGenerateSubtitleTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      SubtitleToolName.GenerateSubtitle,
      `Generate SRT subtitles from video or audio using AI transcription.

Parameters:
- mediaUrl: URL of the video or audio file to transcribe
- language (optional): Target language code (e.g., "zh-CN", "en-US", "ja-JP")

Returns the generated SRT subtitle file URL.

Use this tool when user wants to:
- 给视频加字幕 / Add subtitles to video
- 生成字幕 / Generate subtitles
- 视频转录 / Transcribe video
- 提取视频文字 / Extract text from video`,
      generateSubtitleSchema.shape,
      async ({ mediaUrl, language }) => {
        this.logger.log({ mediaUrl, language }, 'Starting subtitle generation')

        // Step 1: 使用 FFmpeg 提取音频
        this.logger.debug('Extracting audio from media URL')
        const audioBuffer = await this.extractAudioWithFFmpeg(mediaUrl)
        this.logger.debug({ size: audioBuffer.length }, 'Audio extracted')

        // Step 2: 构建提示词
        const prompt = this.buildSubtitlePrompt(language)

        // Step 3: 调用 Gemini 进行转录
        this.logger.debug('Calling Gemini for transcription')
        const response = await this.chatService.userGeminiGenerateContent({
          userId,
          userType,
          model: 'gemini-2.5-flash-preview-09-2025',
          contents: [{
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/aac',
                  data: audioBuffer.toString('base64'),
                },
              },
              { text: prompt },
            ],
          }],
          config: {
            responseMimeType: 'application/json',
          },
        })

        // Step 4: 解析响应
        const responseText = response.text
        if (!responseText) {
          throw new Error('No response from Gemini')
        }

        const subtitleData = JSON.parse(responseText) as { entries: SubtitleEntry[] }
        if (!subtitleData.entries || subtitleData.entries.length === 0) {
          throw new Error('No subtitle entries in response')
        }

        this.logger.debug({ entryCount: subtitleData.entries.length }, 'Subtitle entries parsed')

        // Step 5: 生成 SRT 格式
        const srtContent = this.generateSrtFromEntries(subtitleData.entries)

        // Step 6: 上传 SRT 文件
        this.logger.debug('Uploading SRT file')
        const srtBuffer = Buffer.from(srtContent, 'utf-8')
        const result = await this.assetsService.uploadFromBuffer(userId, srtBuffer, {
          type: AssetType.Subtitle,
          mimeType: 'text/plain',
          filename: `subtitle-${Date.now()}.srt`,
        })

        return successResult(`Subtitle generated successfully!

**SRT File URL:** ${result.url}
**Entries:** ${subtitleData.entries.length}

You can use this SRT URL in video editing to add subtitles.`)
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.Subtitle,
      version: '1.0.0',
      tools: [
        this.createGenerateSubtitleTool(userId, userType),
      ],
    })
  }
}
