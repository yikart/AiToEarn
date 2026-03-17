import { createSdkMcpServer, McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { FileUtil, UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import dayjs from 'dayjs'
import { z } from 'zod'
import { ImageService } from '../../ai/image'
import { geminiVeoVideoCreateRequestSchema, GeminiVideoService, GrokVideoService, OpenAIVideoService } from '../../ai/video'
import { McpServerName } from '../agent.constants'
import { errorResult, successResult, wrapTool } from './mcp.utils'

const generateMediaSchema = z.object({
  prompt: z.string(),
  imageUrls: z.array(z.string()).optional(),
  imageSize: z.enum(['1K', '2K', '4K']).optional(),
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional(),
  model: z.enum(['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview']).optional(),
})

const generateVideoSchema = z.object({
  prompt: z.string(),
  input_reference: z.string().optional(),
  model: z.enum(['sora-2', 'sora-2-pro']).default('sora-2'),
  seconds: z.enum(['8', '10', '25']).optional(),
  size: z.enum(['720x1280', '1280x720', '1024x1792', '1792x1024']).optional(),
})

const getMediaStatusSchema = z.object({
  taskId: z.string(),
})

const createSoraCharacterSchema = z.object({
  prompt: z.string(),
  videoUrl: z.string().optional(),
  taskId: z.string().optional(),
  timestamps: z.string().regex(/^\d+,\d+$/),
})

const getSoraCharacterSchema = z.object({
  characterId: z.string(),
})

const generateVideoWithVeoSchema = z.object({
  params: geminiVeoVideoCreateRequestSchema,
})

const getVeoVideoStatusSchema = z.object({
  taskId: z.string(),
})

const generateVideoWithGrokSchema = z.object({
  prompt: z.string().describe('Video description prompt'),
  model: z.string().default('grok-imagine-video').describe('Grok video model name'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3']).default('9:16').describe('Video aspect ratio'),
  resolution: z.enum(['480p', '720p']).default('720p').describe('Video resolution'),
  duration: z.number().int().min(1).max(15).optional().describe('Video duration in seconds'),
  imageUrl: z.string().optional().describe('Reference image URL for image-to-video generation'),
})

const getGrokVideoStatusSchema = z.object({
  taskId: z.string().describe('Task ID returned from generateVideoWithGrok'),
})

export enum MediaToolName {
  GenerateImage = 'generateImage',
  GenerateVideo = 'generateVideo',
  GetVideoStatus = 'getVideoStatus',
  CreateSoraCharacter = 'createSoraCharacter',
  GetSoraCharacter = 'getSoraCharacter',
  GenerateVideoWithVeo = 'generateVideoWithVeo',
  GetVeoVideoStatus = 'getVeoVideoStatus',
  GenerateVideoWithGrok = 'generateVideoWithGrok',
  GetGrokVideoStatus = 'getGrokVideoStatus',
}

@Injectable()
export class MediaMcp {
  private readonly logger = new Logger(MediaMcp.name)

  constructor(
    private readonly openaiVideoService: OpenAIVideoService,
    private readonly imageService: ImageService,
    private readonly geminiVideoService: GeminiVideoService,
    private readonly grokVideoService: GrokVideoService,
  ) { }

  createGenerateImageTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GenerateImage,
      `Generate an image using Gemini model.

Parameters:
- prompt: Text description of the image
- imageUrls (optional): Reference image URLs for editing
- imageSize (optional): "1K", "2K", or "4K"
- aspectRatio (optional): "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
- model (optional): "gemini-3.1-flash-image-preview" (default) or "gemini-3-pro-image-preview"

Returns the generated image URL(s).`,
      generateMediaSchema.shape,
      async ({ prompt, imageUrls = [], imageSize, aspectRatio, model }) => {
        this.logger.debug(`[generateImage] Starting image generation for user ${userId}`)
        const startTime = Date.now()

        const result = await this.imageService.userGeminiGeneration({
          userId,
          userType,
          prompt,
          imageUrls,
          imageSize,
          aspectRatio,
          ...(model ? { model } : {}),
        })

        const generatedImages = result.images.map(img => ({ ...img, url: FileUtil.buildUrl(img.url!) }))

        const duration = Date.now() - startTime
        this.logger.debug(`[generateImage] Image generation completed in ${duration}ms for user ${userId}, count: ${generatedImages.length}`)

        const text = generatedImages.map((img, index) => `Image URL ${index + 1}: ${img.url}`).join('\n')

        return {
          content: [
            ...generatedImages.map((img, index) => ({
              type: 'resource_link',
              uri: img.url,
              name: `Image ${index + 1}`,
            } as const)),
            { type: 'text', text },
          ],
        }
      },
    )
  }

  createGenerateVideoTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GenerateVideo,
      `Generate a video using OpenAI Sora model. Follow the Sora Prompting Guide for best results.

**IMPORTANT: Use the same language as the user's request for the video prompt.**

**Model Selection**:
- sora-2 (default): 10s 720p video, supports audio/voiceover
- sora-2-pro: 25s 1024p video - use when user requests high quality/HD or long shots

**Sora Prompt Engineering Guidelines**:

1. **Specificity over Abstraction**: Use concrete details instead of vague descriptions.
   - Bad: "a beautiful street" / "美丽的街道"
   - Good: "wet asphalt reflecting neon lights, zebra crossing, steam rising from manholes" / "湿润的沥青反射着霓虹灯光，斑马线清晰可见，井盖冒着蒸汽"

2. **Establish Visual Style First**: Set the visual tone at the beginning.
   - Example: "1970s film grain aesthetic" / "1970年代胶片质感", "cinematic documentary style" / "电影纪录片风格"

3. **Camera Composition**: Specify framing and position.
   - Framing: wide shot (全景), medium close-up (中近景), extreme close-up (特写)
   - Position: eye-level (平视), low angle (低角度), aerial view (鸟瞰)

4. **Depth and Focus**: Describe depth of field.
   - "shallow depth of field with blurred background" / "浅景深，背景虚化"

5. **Lighting and Color**: Be specific about light sources and color palette.
   - "golden hour sunlight casting long shadows" / "黄金时段的阳光投下长长的影子"

6. **Action and Timing**: One camera movement + one subject action per shot.
   - "Camera slowly pans left as the woman walks towards the window" / "镜头缓慢向左平移，女子走向窗边"

7. **Character Consistency**: Include detailed character descriptions for recurring characters.

**Audio/Voiceover Guidelines (口播/旁白)**:
- Sora supports native audio generation with voiceover/narration
- Supports: Chinese (中文), English, Japanese (日本語), etc.
- Describe narration as a separate element at the end of the prompt

**Voiceover Prompt Format**:
[Scene description] + [Camera] + [Atmosphere] + [Action] + [Voiceover content]

**Examples**:
Chinese: "纪录片场景：海浪拍打礁石。全景，稳定镜头。平静氛围。男声旁白：'大自然的力量无处不在'"
English: "Product showcase of smartphone on white surface. Close-up, slow rotation. Minimalist aesthetic. Female voiceover: 'The new design features a seamless display'"

Returns task ID for status tracking.`,
      generateVideoSchema.shape,
      async ({ prompt, input_reference, model, seconds, size }) => {
        const finalSeconds = seconds || (model === 'sora-2-pro' ? '25' : '10')
        const finalSize = size || (model === 'sora-2-pro' ? '1024x1792' : '720x1280')

        const response = await this.openaiVideoService.createVideo({
          userId,
          userType,
          prompt,
          input_reference,
          model,
          seconds: finalSeconds,
          size: finalSize,
        })
        const { id, error, status } = response

        if (status === AiLogStatus.Failed) {
          return errorResult(`Failed to generate video with OpenAI ${model}, Error: ${error || 'Unknown error'}`)
        }

        return successResult(`Video is generating with OpenAI ${model}, task id: ${id}`)
      },
    )
  }

  createGetVideoStatusTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GetVideoStatus,
      'Get video generation task status. Provide taskId. Returns task status, progress percentage, and video URL when completed. Response includes start time, current time, and elapsed time for tracking generation progress.',
      getMediaStatusSchema.shape,
      async ({ taskId }) => {
        const result = await this.openaiVideoService.getVideo(userId, userType, taskId)

        const startTime = result.created_at || 0
        let timeInfo = ''
        if (startTime > 0) {
          const start = dayjs.unix(startTime)
          const current = dayjs()
          const elapsedSeconds = current.diff(start, 'second')
          const elapsedMinutes = current.diff(start, 'minute')
          const remainingSeconds = elapsedSeconds % 60
          timeInfo = `\nStart time: ${start.toISOString()}\nCurrent time: ${current.toISOString()}\nElapsed time: ${elapsedMinutes} minutes ${remainingSeconds} seconds`
        }

        if (result.status === 'completed' && (result.url || result.video_url)) {
          const videoUrl = result.url || result.video_url || ''
          const fullVideoUrl = FileUtil.buildUrl(videoUrl)
          return successResult(`Video is completed, task id: ${taskId} and video url is ${fullVideoUrl}${timeInfo}`)
        }
        if (result.status === 'failed') {
          return errorResult(`Video is failed, task id: ${taskId} and error message is ${result.error?.message || 'Unknown error'}${timeInfo}`)
        }
        return successResult(`Video is ${result.status}, progress: ${result.progress}%, task id: ${taskId}${timeInfo}`)
      },
    )
  }

  createSoraCharacterTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.CreateSoraCharacter,
      `Create a reusable character from video for Sora generation.

**Purpose**: Maintain consistent character appearance across multiple video generations. Once created, the same character can be referenced in different videos with identical visual features.

**Creation Methods**:
1. From Video URL: Provide videoUrl parameter
2. From Task ID: Provide taskId parameter (existing Sora task)

**timestamps**: Two numbers separated by comma (e.g., "1,3"), gap must be ≤ 3 seconds

**Processing Time**: Character creation takes approximately 400 seconds (~7 minutes)

**Usage**: After creation, use @{username} in prompts to reference character
Example: "@character1 walks through a garden"`,
      createSoraCharacterSchema.shape,
      async ({ prompt, videoUrl, taskId, timestamps }) => {
        const response = await this.openaiVideoService.createCharacter({
          userId,
          userType,
          prompt,
          videoUrl,
          taskId,
          timestamps,
        })

        if (response.status === 'failed') {
          return errorResult(`Failed to create character, Error: ${response.error?.message || 'Unknown error'}`)
        }

        return successResult(`Character is creating, character id: ${response.id}, use @${response.username} to reference in prompts`)
      },
    )
  }

  createGetSoraCharacterTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GetSoraCharacter,
      'Get Sora character creation status. Provide characterId. Returns character status and username for referencing in prompts.',
      getSoraCharacterSchema.shape,
      async ({ characterId }) => {
        const result = await this.openaiVideoService.getCharacter(userId, userType, characterId)

        if (result.status === 'completed') {
          return successResult(`Character is ready, character id: ${result.id}, username: @${result.username}. Use @${result.username} in video prompts to reference this character.`)
        }
        if (result.status === 'failed') {
          return errorResult(`Character creation failed, character id: ${result.id}, error: ${result.error?.message || 'Unknown error'}`)
        }
        return successResult(`Character is ${result.status}, character id: ${result.id}`)
      },
    )
  }

  createGenerateVideoWithVeoTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GenerateVideoWithVeo,
      `Generate a video using Google Veo 3.1 model with native audio support.
Follow the generating-videos skill for prompt guidelines.

**Models**:
- veo-3.1-fast-generate-001 (default): Fast generation
- veo-3.1-generate-001: Standard generation (higher quality)
- veo-3.1-fast-generate-preview: Fast preview + video extension
- veo-3.1-generate-preview: Preview + video extension + reference images

**Generation Modes** (auto-detected):
- Text-to-video: Only prompt
- Image-to-video: prompt + image
- First-last-frame: prompt + image + lastFrame
- Video extension: prompt + video (preview models only, input & output 720p only, ~7s per extension, max 4 times)
- Reference images: prompt + referenceImages (veo-3.1-generate-preview only, max 3)

**Video Extension Note**: Prefer using GCS URI (\`gs://bucket/path\`) over HTTP URL for the \`video\` parameter - it's more efficient (no download/base64 conversion needed).

**Parameters**:
- negativePrompt: What to exclude from the video
- duration: 4, 6, or 8 seconds (default: 8)
- resolution: "720p", "1080p", or "4000" (default: 720p, 1080p/4K takes longer)
- aspectRatio: "16:9" or "9:16" (default: 16:9)
- seed: Random seed for reproducibility

Returns task ID for status tracking.`,
      generateVideoWithVeoSchema.shape,
      async ({ params }) => {
        const response = await this.geminiVideoService.createVideo({
          userId,
          userType,
          ...params,
        })
        const { id, error } = response

        if (error) {
          return errorResult(`Failed to generate video with Veo ${params.model}, Error: ${error || 'Unknown error'}`)
        }

        return successResult(`Video is generating with Veo ${params.model}, task id: ${id}`)
      },
    )
  }

  createGetVeoVideoStatusTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GetVeoVideoStatus,
      'Get Veo video generation task status. Provide taskId. Returns task status, progress percentage, and video URL when completed.',
      getVeoVideoStatusSchema.shape,
      async ({ taskId }) => {
        const result = await this.geminiVideoService.getVideo(userId, userType, taskId)

        const current = dayjs()
        const elapsedSeconds = current.diff(result.createdAt, 'second')
        const elapsedMinutes = current.diff(result.createdAt, 'minute')
        const remainingSeconds = elapsedSeconds % 60
        const timeInfo = `\nStart time: ${result.createdAt.toISOString()}\nCurrent time: ${current.toISOString()}\nElapsed time: ${elapsedMinutes} minutes ${remainingSeconds} seconds`

        if (result.status === AiLogStatus.Success) {
          const videoInfos = result.generatedVideos.map((video, index) => {
            const s3Url = FileUtil.buildUrl(video.url)
            const gcsUri = video.gcsUrl ? `\n  GCS URI: ${video.gcsUrl}` : ''
            return `Video ${index + 1}:\n  HTTP URL: ${s3Url}${gcsUri}`
          })
          return successResult(`Video is completed, task id: ${taskId}\n${videoInfos.join('\n')}${timeInfo}`)
        }
        if (result.status === AiLogStatus.Failed) {
          return errorResult(`Video is failed, task id: ${taskId} and error message is ${result.error ? JSON.stringify(result.error) : 'Unknown error'}${timeInfo}`)
        }
        return successResult(`Video is ${result.status}, task id: ${taskId}${timeInfo}`)
      },
    )
  }

  createGenerateVideoWithGrokTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GenerateVideoWithGrok,
      `Generate a video using Grok video model.

**IMPORTANT: Use the same language as the user's request for the video prompt.**

**Model**: grok-imagine-video (default)

**Generation Modes**:
- Text-to-video: Only prompt
- Image-to-video: prompt + imageUrl

**Parameters**:
- prompt: Detailed video description
- model: Model name (default: grok-imagine-video)
- aspectRatio: "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3" (default: 9:16)
- resolution: "480p", "720p" (default: 720p)
- duration: Video duration in seconds (1-15, optional)
- imageUrl: Reference image URL for image-to-video generation (optional)

Returns task ID for status tracking.`,
      generateVideoWithGrokSchema.shape,
      async ({ prompt, model, aspectRatio, resolution, duration, imageUrl }) => {
        const response = await this.grokVideoService.createVideo({
          userId,
          userType,
          prompt,
          model,
          aspectRatio,
          resolution,
          duration,
          imageUrl,
        })

        return successResult(`Video is generating with Grok ${model}, task id: ${response.id}`)
      },
    )
  }

  createGetGrokVideoStatusTool(userId: string, userType: UserType) {
    return wrapTool(
      this.logger,
      MediaToolName.GetGrokVideoStatus,
      'Get Grok video generation task status. Provide taskId. Returns task status and video URL when completed.',
      getGrokVideoStatusSchema.shape,
      async ({ taskId }) => {
        const result = await this.grokVideoService.getTask(userId, userType, taskId)

        if (result.videoUrl) {
          return successResult(`Video is completed, task id: ${taskId} and video url is ${result.videoUrl}`)
        }
        if (result.error) {
          return errorResult(`Video failed, task id: ${taskId} and error message is ${result.error}`)
        }
        return successResult(`Video is ${result.status}, task id: ${taskId}`)
      },
    )
  }

  createServer(userId: string, userType: UserType): McpSdkServerConfigWithInstance {
    return createSdkMcpServer({
      name: McpServerName.MediaGeneration,
      version: '1.0.0',
      tools: [
        this.createGenerateImageTool(userId, userType),
        // this.createGenerateVideoTool(userId, userType),
        // this.createGetVideoStatusTool(userId, userType),
        // this.createSoraCharacterTool(userId, userType),
        // this.createGetSoraCharacterTool(userId, userType),
        // this.createGenerateVideoWithVeoTool(userId, userType),
        // this.createGetVeoVideoStatusTool(userId, userType),
        this.createGenerateVideoWithGrokTool(userId, userType),
        this.createGetGrokVideoStatusTool(userId, userType),
      ],
    })
  }
}
