import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { UserType } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import { execa } from 'execa'
import * as subtitle from 'subtitle'
import { z } from 'zod'
import { ChatService } from '../../ai/chat'
import { GeminiService } from '../../ai/libs/gemini'
import { VolcengineService } from '../../ai/libs/volcengine'
import { McpServerName } from '../agent.constants'
import { errorResult, srtTimestampToMs, successResult, wrapTool } from './mcp.utils'

const getVolcVideoInfoSchema = z.object({
  vids: z.array(z.string()).min(1).describe('Volcengine video VID list, supports vid://xxx format or plain VID string'),
})

const uploadAndGetVidSchema = z.object({
  videoUrl: z.string().describe('Video URL'),
})

const probeVideoMetadataSchema = z.object({
  videoUrl: z.string().describe('Video URL'),
})

const extractThumbnailSchema = z.object({
  videoUrl: z.string().describe('Video URL'),
  timeInSeconds: z.number().min(0).default(1).describe('Time point in seconds to extract frame, default 1 second'),
})

const generateSubtitleSchema = z.object({
  mediaUrl: z.string().describe('Video or audio URL to transcribe'),
  language: z.string().optional().describe('Target language code, e.g., "zh-CN", "en-US"'),
})

const srtNodesSchema = z.object({
  start: z.string().describe('Start time in SRT format: HH:MM:SS,sss'),
  end: z.string().describe('End time in SRT format: HH:MM:SS,sss'),
  text: z.string().describe('Subtitle text'),
}).array()

export enum VideoUtilsToolName {
  GetVolcVideoInfo = 'getVolcVideoInfo',
  UploadAndGetVid = 'uploadAndGetVid',
  ProbeVideoMetadata = 'probeVideoMetadata',
  ExtractThumbnail = 'extractThumbnail',
  GenerateSubtitle = 'generateSubtitle',
}

interface VideoInfoSuccess {
  vid: string
  duration: number
  width: number
  height: number
  fileSize: number
  format: string
  bitrate: number
  frameRate: number
  codecName: string
}

interface VideoInfoError {
  vid: string
  error: string
}

@Injectable()
export class VideoUtilsMcp {
  private readonly logger = new Logger(VideoUtilsMcp.name)

  constructor(
    private readonly volcengineService: VolcengineService,
    private readonly assetsService: AssetsService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly chatService: ChatService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * 获取火山引擎视频信息（仅支持 VID）
   */
  createGetVolcVideoInfoTool(_userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      VideoUtilsToolName.GetVolcVideoInfo,
      `Get video information from Volcengine by VID. Use this after uploading video to Volcengine.

Use this tool to:
- Get video duration for time calculations
- Get video dimensions for canvas setup
- Get video metadata (format, bitrate, fps)

Input: Array of VIDs (supports "vid://xxx" format or plain VID string)
Returns: Array of { vid, duration, width, height, format, ... }`,
      getVolcVideoInfoSchema.shape,
      async ({ vids }) => {
        const normalizedVids = vids.map((vid) => {
          if (vid.startsWith('vid://')) {
            return vid.replace('vid://', '')
          }
          return vid
        })

        const mediaInfos = await this.volcengineService.getMediaInfos({
          Vids: normalizedVids.join(','),
        })

        const successResults: VideoInfoSuccess[] = []
        const errorResults: VideoInfoError[] = []

        for (let index = 0; index < normalizedVids.length; index++) {
          const vid = normalizedVids[index]
          const mediaInfo = mediaInfos.MediaInfoList?.[index]

          if (!mediaInfo) {
            errorResults.push({ vid, error: 'Video not found or inaccessible' })
            continue
          }

          const sourceInfo = mediaInfo.SourceInfo
          successResults.push({
            vid,
            duration: sourceInfo?.Duration || 0,
            width: sourceInfo?.Width || 0,
            height: sourceInfo?.Height || 0,
            fileSize: sourceInfo?.Size || 0,
            format: sourceInfo?.Format || 'unknown',
            bitrate: sourceInfo?.Bitrate || 0,
            frameRate: sourceInfo?.Fps || 0,
            codecName: sourceInfo?.Codec || 'unknown',
          })
        }

        if (successResults.length === 0) {
          return errorResult(`All videos failed:\n${errorResults.map(r => `- vid://${r.vid}: ${r.error}`).join('\n')}`)
        }

        const infoMessages = successResults.map((videoInfo) => {
          const durationMs = videoInfo.duration * 1000

          return `**Video: vid://${videoInfo.vid}**
- Duration: ${videoInfo.duration} seconds (${durationMs} milliseconds)
- Resolution: ${videoInfo.width}x${videoInfo.height}
- File Size: ${(videoInfo.fileSize / 1024 / 1024).toFixed(2)} MB
- Format: ${videoInfo.format}
- Bitrate: ${(videoInfo.bitrate / 1000).toFixed(0)} kbps
- Frame Rate: ${videoInfo.frameRate} fps
- Codec: ${videoInfo.codecName}

**For video editing:**
- Use Source: "vid://${videoInfo.vid}"
- Video dimensions: ${videoInfo.width}x${videoInfo.height} (Canvas will be auto-detected if omitted in submitDirectEditTask)
- Full video TargetTime: [0, ${durationMs}]`
        }).join('\n\n---\n\n')

        let message = `Video Information Retrieved (${successResults.length}/${normalizedVids.length} successful):\n\n${infoMessages}`

        if (errorResults.length > 0) {
          message += `\n\n**Failed videos:**\n${errorResults.map(r => `- vid://${r.vid}: ${r.error}`).join('\n')}`
        }

        return successResult(message)
      },
    )
  }

  /**
   * 上传视频到火山引擎并获取 VID
   */
  createUploadAndGetVidTool(_userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      VideoUtilsToolName.UploadAndGetVid,
      `Upload a video from URL to Volcengine cloud and get VID. Required before video editing.

Use this tool to:
- Convert HTTP URL to VID for Volcengine video editing
- Get video information after upload

Returns: { vid, duration, width, height, ... }`,
      uploadAndGetVidSchema.shape,
      async ({ videoUrl }) => {
        this.logger.debug({ url: videoUrl }, '[UploadAndGetVid] Uploading video URL to Volcengine')

        const vid = await this.volcengineService.downloadUrlAndUploadAsStream(videoUrl)
        this.logger.debug({ vid }, '[UploadAndGetVid] Video uploaded successfully')

        const mediaInfos = await this.volcengineService.getMediaInfos({
          Vids: vid,
        })

        const mediaInfo = mediaInfos.MediaInfoList?.[0]
        if (!mediaInfo) {
          return errorResult('Video uploaded but failed to retrieve information')
        }

        const sourceInfo = mediaInfo.SourceInfo
        const duration = sourceInfo?.Duration || 0
        const durationMs = duration * 1000

        return successResult(`Video uploaded successfully!

**VID:** vid://${vid}
**Duration:** ${duration} seconds (${durationMs} milliseconds)
**Resolution:** ${sourceInfo?.Width || 0}x${sourceInfo?.Height || 0}
**Format:** ${sourceInfo?.Format || 'unknown'}
**Bitrate:** ${((sourceInfo?.Bitrate || 0) / 1000).toFixed(0)} kbps
**Frame Rate:** ${sourceInfo?.Fps || 0} fps

**For video editing:**
- Use Source: "vid://${vid}"
- Video dimensions: ${sourceInfo?.Width || 0}x${sourceInfo?.Height || 0} (Canvas will be auto-detected if omitted in submitDirectEditTask)
- Full video TargetTime: [0, ${durationMs}]`)
      },
    )
  }

  /**
   * 使用 ffprobe 获取视频元数据（不上传）
   */
  createProbeVideoMetadataTool(_userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      VideoUtilsToolName.ProbeVideoMetadata,
      `Probe video metadata from URL using ffprobe. Does NOT upload the video.

Use this tool when you only need video metadata (duration, dimensions) without editing:
- Display video information to user
- Check video properties before processing
- Validate video format

Returns: { width, height, duration, bitrate, frameRate }`,
      probeVideoMetadataSchema.shape,
      async ({ videoUrl }) => {
        this.logger.debug({ url: videoUrl }, '[ProbeVideoMetadata] Probing video metadata')

        const metadata = await this.videoMetadataService.probeVideoMetadata(videoUrl)

        return successResult(`Video Metadata:
- Resolution: ${metadata.width}x${metadata.height}
- Duration: ${metadata.duration} seconds (${metadata.duration * 1000} milliseconds)
- Bitrate: ${(metadata.bitrate / 1000).toFixed(0)} kbps
- Frame Rate: ${metadata.frameRate} fps

Note: This video has NOT been uploaded to Volcengine. Use uploadAndGetVid if you need to edit it.`)
      },
    )
  }

  /**
   * 提取视频缩略图
   */
  createExtractThumbnailTool(userId: string, _userType: UserType) {
    return wrapTool(
      this.logger,
      VideoUtilsToolName.ExtractThumbnail,
      'Extract a thumbnail from a video URL at a specified time point. Uses ffmpeg to directly stream from the URL without downloading the full video. Returns the uploaded thumbnail URL.',
      extractThumbnailSchema.shape,
      async ({ videoUrl, timeInSeconds }) => {
        this.logger.debug({ userId, videoUrl, timeInSeconds }, '[extractThumbnail] Starting thumbnail extraction')

        const thumbnailBuffer = await this.videoMetadataService.extractThumbnailFromUrl(videoUrl, timeInSeconds)
        this.logger.debug({ size: thumbnailBuffer.length }, '[extractThumbnail] Frame extracted')

        const result = await this.assetsService.uploadFromBuffer(userId, thumbnailBuffer, {
          type: AssetType.VideoThumbnail,
          mimeType: 'image/png',
          filename: 'thumbnail.png',
        })

        this.logger.debug({ thumbnailUrl: result.url }, '[extractThumbnail] Thumbnail uploaded')

        return successResult(`Thumbnail extracted and uploaded successfully. URL: ${result.url}`)
      },
    )
  }

  /**
   * 使用 FFmpeg 从 URL 提取音频
   */
  private async extractAudioWithFFmpeg(mediaUrl: string): Promise<Buffer> {
    const tempDir = os.tmpdir()
    const outputPath = path.join(tempDir, `audio-${Date.now()}.mp3`)
    try {
      await execa('ffmpeg', [
        '-i',
        mediaUrl,
        '-map',
        '0:a:0',
        '-vn',
        '-acodec',
        'libmp3lame',
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
    const languageInstruction = language
      ? `Transcribe the audio and translate into ${language}. All subtitle text must be in ${language}.`
      : `Transcribe the audio in its original spoken language.`

    return `${languageInstruction}

## Rules

1. **Accuracy**: Only transcribe speech actually present in the audio. Never add or fabricate content.

2. **Timestamps**:
   - Use SRT format: HH:MM:SS,sss (e.g., 00:00:01,500)
   - Timestamps must accurately match when speech occurs in the audio
   - The last subtitle should end near the actual end of speech
   - Minimum subtitle duration: 1.5 seconds for readability

3. **Segmentation**: Split at natural speech pauses. Each subtitle should be a complete phrase.

4. **Translation** (if applicable): Translate naturally while preserving the original meaning.

## Output Format

JSON array with SRT timestamps:
[
  {"start": "00:00:00,500", "end": "00:00:03,000", "text": "Hello everyone."},
  {"start": "00:00:03,500", "end": "00:00:06,000", "text": "Welcome to today's video."}
]`
  }

  /**
   * 生成字幕
   */
  createGenerateSubtitleTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      VideoUtilsToolName.GenerateSubtitle,
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

        const audioBuffer = await this.extractAudioWithFFmpeg(mediaUrl)

        const keyPairId = this.geminiService.keyManager.getDefaultKeyPairId()
        const gcsPath = `audio/subtitle-${Date.now()}.mp3`
        const gcsUri = await this.geminiService.uploadToGcs(audioBuffer, {
          keyPairId,
          path: gcsPath,
          mimeType: 'audio/mp3',
        })

        const prompt = this.buildSubtitlePrompt(language)

        this.logger.debug({ mediaUrl, language, gcsUri }, 'Calling Gemini for transcription')
        const response = await this.chatService.userGeminiGenerateContent({
          userId,
          userType,
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: gcsUri,
                  mimeType: 'audio/mp3',
                },
              },
              { text: prompt },
            ],
          }],
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(srtNodesSchema),
          },
        })

        const responseText = response.text
        if (!responseText) {
          throw new Error('No response from Gemini')
        }

        const result = z.safeParse(srtNodesSchema, JSON.parse(responseText))
        if (!result.success) {
          throw new Error(`Invalid subtitle data: ${z.prettifyError(result.error)}`)
        }
        const subtitleData = result.data.map(node => ({
          type: 'cue',
          data: {
            ...node,
            start: srtTimestampToMs(node.start),
            end: srtTimestampToMs(node.end),
          },
        } as const))

        const srtContent = subtitle.stringifySync(subtitleData, { format: 'SRT' })

        this.logger.debug('Uploading SRT file')
        const srtBuffer = Buffer.from(srtContent, 'utf-8')
        const uploadResult = await this.assetsService.uploadFromBuffer(userId, srtBuffer, {
          type: AssetType.Subtitle,
          mimeType: 'text/plain',
          filename: `subtitle-${Date.now()}.srt`,
        })

        return successResult(`Subtitle generated successfully!
**SRT File URL:** ${uploadResult.url}
You can use this SRT URL in video editing to add subtitles.`)
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.VideoUtils,
      version: '1.0.0',
      tools: [
        this.createGetVolcVideoInfoTool(userId, userType),
        this.createUploadAndGetVidTool(userId, userType),
        this.createProbeVideoMetadataTool(userId, userType),
        this.createExtractThumbnailTool(userId, userType),
        // this.createGenerateSubtitleTool(userId, userType),
      ],
    })
  }
}
