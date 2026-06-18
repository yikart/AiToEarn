import type { VolcengineVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AssetsService, StorageProvider } from '@yikart/assets'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { config } from '../../../../config'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import {
  AudioRole,
  Content,
  ContentType,
  CreateVideoGenerationTaskRequest,
  CreateVideoGenerationTaskResponse,
  GetVideoGenerationTaskResponse,
  ImageRole,
  parseModelTextCommand,
  ToolType,
  VideoRole,
  VolcengineService as VolcengineLibService,
  TaskStatus as VolcTaskStatus,
} from '../../libs/volcengine'
import { UserVolcengineGenerationRequestDto, VolcengineCallbackDto } from './volcengine.dto'

@Injectable()
export class VolcengineVideoService {
  private readonly logger = new Logger(VolcengineVideoService.name)

  constructor(
    private readonly volcengineLibService: VolcengineLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly storageProvider: StorageProvider,
    private readonly aiAvailability: AiAvailabilityService,
  ) {}

  private async toAccessibleUrl(url: string | undefined): Promise<string | undefined> {
    if (!url) {
      return undefined
    }
    const parsed = this.storageProvider.parsePathFromUrl(url)
    if (parsed.startsWith('http')) {
      return url
    }
    return this.storageProvider.toPresignedUrl(url)
  }

  async createFromRequest(request: UserVideoGenerationRequestDto): Promise<{ id: string }> {
    const content: Content[] = []
    const legacyFrameImage = !Array.isArray(request.image) ? request.image : undefined
    const additionalReferenceImages = [...(Array.isArray(request.image) ? request.image : []), ...(request.images || [])]
    const referenceVideos = [...(request.video_url ? [request.video_url] : []), ...(request.videos || [])]
    const referenceAudios = request.audios || []
    const hasExplicitReferenceMedia = additionalReferenceImages.length > 0 || referenceVideos.length > 0 || referenceAudios.length > 0
    const usesLegacyFrameInput = !!legacyFrameImage && (!hasExplicitReferenceMedia || !!request.image_tail)
    const referenceImages = [
      ...additionalReferenceImages,
      ...(!usesLegacyFrameInput && legacyFrameImage ? [legacyFrameImage] : []),
    ]

    if (usesLegacyFrameInput) {
      content.push({
        type: ContentType.ImageUrl,
        image_url: { url: await this.toAccessibleUrl(legacyFrameImage) || legacyFrameImage },
        role: ImageRole.FirstFrame,
      })
    }

    if (request.image_tail) {
      if (!legacyFrameImage) {
        throw new BadRequestException('image_tail requires a single first frame image')
      }
      content.push({
        type: ContentType.ImageUrl,
        image_url: { url: await this.toAccessibleUrl(request.image_tail) || request.image_tail },
        role: ImageRole.LastFrame,
      })
    }

    if (!request.image_tail) {
      for (const imageUrl of referenceImages) {
        content.push({
          type: ContentType.ImageUrl,
          image_url: { url: await this.toAccessibleUrl(imageUrl) || imageUrl },
          role: usesLegacyFrameInput && imageUrl === legacyFrameImage ? ImageRole.FirstFrame : ImageRole.ReferenceImage,
        })
      }
    }

    for (const referenceVideo of referenceVideos) {
      content.push({
        type: ContentType.VideoUrl,
        video_url: { url: await this.toAccessibleUrl(referenceVideo) || referenceVideo },
        role: VideoRole.ReferenceVideo,
      })
    }

    for (const referenceAudio of referenceAudios) {
      content.push({
        type: ContentType.AudioUrl,
        audio_url: { url: await this.toAccessibleUrl(referenceAudio) || referenceAudio },
        role: AudioRole.ReferenceAudio,
      })
    }

    content.push({
      type: ContentType.Text,
      text: request.prompt,
    })

    const result = await this.create({
      userId: request.userId,
      userType: request.userType,
      model: request.model,
      content,
      duration: request.duration,
      resolution: request.resolution || request.size,
      ratio: request.ratio || request.metadata?.['aspectRatio'] as string | undefined,
      seed: request.seed,
      watermark: request.watermark,
      tools: request.tools?.map(tool => ({ type: tool.type === 'web_search' ? ToolType.WebSearch : tool.type })),
    })

    return { id: result.id }
  }

  private buildSafetyIdentifier(userId: string, userType: UserType): string {
    return `${userType}:${userId}`
  }

  private getFailureMessage(status: VolcTaskStatus, callbackData: VolcengineCallbackDto): string | undefined {
    if (status === VolcTaskStatus.Failed) {
      return callbackData.error?.message || 'Volcengine task failed'
    }

    if (status === VolcTaskStatus.Expired) {
      return callbackData.error?.message || 'Volcengine task expired'
    }

    return undefined
  }

  private validateContent(content: Content[]) {
    if (content.length === 0) {
      throw new BadRequestException('content is required')
    }

    const imageContents = content.filter((item): item is Extract<Content, { type: ContentType.ImageUrl }> => item.type === ContentType.ImageUrl)
    const videoContents = content.filter((item): item is Extract<Content, { type: ContentType.VideoUrl }> => item.type === ContentType.VideoUrl)
    const audioContents = content.filter((item): item is Extract<Content, { type: ContentType.AudioUrl }> => item.type === ContentType.AudioUrl)

    const firstFrameImages = imageContents.filter(item => !item.role || item.role === ImageRole.FirstFrame)
    const lastFrameImages = imageContents.filter(item => item.role === ImageRole.LastFrame)
    const referenceImages = imageContents.filter(item => item.role === ImageRole.ReferenceImage)
    const referenceVideos = videoContents.filter(item => item.role === VideoRole.ReferenceVideo)
    const referenceAudios = audioContents.filter(item => item.role === AudioRole.ReferenceAudio)

    const hasFrameScene = firstFrameImages.length > 0 || lastFrameImages.length > 0
    const hasReferenceScene = referenceImages.length > 0 || referenceVideos.length > 0 || referenceAudios.length > 0

    if (firstFrameImages.length > 1) {
      throw new BadRequestException('Only one first frame image is allowed')
    }

    if (lastFrameImages.length > 1) {
      throw new BadRequestException('Only one last frame image is allowed')
    }

    if (lastFrameImages.length > 0 && firstFrameImages.length === 0) {
      throw new BadRequestException('last_frame requires first_frame')
    }

    if (hasFrameScene && hasReferenceScene) {
      throw new BadRequestException('first_frame/last_frame and reference media cannot be mixed')
    }

    if (referenceAudios.length > 0 && referenceImages.length === 0 && referenceVideos.length === 0) {
      throw new BadRequestException('reference_audio requires at least one reference image or reference video')
    }
  }

  private normalizeRequest(request: UserVolcengineGenerationRequestDto) {
    let prompt = ''
    let inlineResolution: string | undefined
    let inlineRatio: string | undefined
    let inlineDuration: number | undefined
    let inlineSeed: number | undefined
    let inlineWatermark: boolean | undefined

    const normalizedContent = request.content.map((item) => {
      if (item.type !== ContentType.Text) {
        return item
      }

      const parsed = parseModelTextCommand(item.text)
      if (!prompt && parsed.prompt) {
        prompt = parsed.prompt
      }
      inlineResolution = inlineResolution ?? parsed.params.resolution
      inlineRatio = inlineRatio ?? parsed.params.ratio
      inlineDuration = inlineDuration ?? parsed.params.duration
      inlineSeed = inlineSeed ?? parsed.params.seed
      inlineWatermark = inlineWatermark ?? parsed.params.watermark

      return {
        ...item,
        text: parsed.prompt,
      }
    })

    this.validateContent(normalizedContent)
    if (!prompt.trim()) {
      throw new BadRequestException('text prompt is required')
    }

    const aiLogRequest = {
      model: request.model,
      content: normalizedContent,
      return_last_frame: request.return_last_frame,
      resolution: request.resolution ?? inlineResolution,
      ratio: request.ratio ?? inlineRatio,
      duration: request.duration ?? inlineDuration,
      seed: request.seed ?? inlineSeed,
      watermark: request.watermark ?? inlineWatermark,
      tools: request.tools,
    }

    const requestBody: CreateVideoGenerationTaskRequest = {
      ...aiLogRequest,
      callback_url: config.ai.volcengine?.callbackUrl,
      safety_identifier: this.buildSafetyIdentifier(request.userId, request.userType),
    }

    return {
      prompt,
      requestBody,
      aiLogRequest,
    }
  }

  /**
   * Volcengine视频生成
   */
  async create(request: UserVolcengineGenerationRequestDto) {
    const { userId, userType, model } = request
    const normalized = this.normalizeRequest(request)

    const startedAt = new Date()
    const result = await this.aiAvailability.executeAsync(
      { provider: 'volcengine', operation: 'videoGeneration', model },
      () => this.volcengineLibService.createVideoGenerationTask(normalized.requestBody),
      r => r.id,
    )

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.id,
      model,
      channel: AiLogChannel.Volcengine,
      startedAt,
      type: AiLogType.Video,
      request: normalized.aiLogRequest,
      status: AiLogStatus.Generating,
    })

    return {
      ...result,
      id: aiLog.id,
    } as CreateVideoGenerationTaskResponse
  }

  /**
   * Volcengine回调处理
   */
  async callback(callbackData: GetVideoGenerationTaskResponse) {
    const { id, status, updated_at, content } = callbackData

    const aiLog = await this.aiLogRepo.getByTaskId(id)
    if (!aiLog || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const volcengineAiLog = aiLog as VolcengineVideoAiLog

    if (volcengineAiLog.status !== AiLogStatus.Generating) {
      return
    }

    if (
      status !== VolcTaskStatus.Succeeded
      && status !== VolcTaskStatus.Failed
      && status !== VolcTaskStatus.Expired
    ) {
      return
    }

    let aiLogStatus: AiLogStatus
    switch (status) {
      case VolcTaskStatus.Succeeded:
        aiLogStatus = AiLogStatus.Success
        break
      case VolcTaskStatus.Failed:
      case VolcTaskStatus.Expired:
        aiLogStatus = AiLogStatus.Failed
        break
      default:
        aiLogStatus = AiLogStatus.Generating
        break
    }

    if (content) {
      if (content.last_frame_url) {
        const result = await this.assetsService.uploadFromUrl(volcengineAiLog.userId, {
          url: content.last_frame_url,
          type: AssetType.AiImage,
        }, `${volcengineAiLog.model}`)
        content.last_frame_url = result.asset.path
      }

      const result = await this.assetsService.uploadFromUrl(volcengineAiLog.userId, {
        url: content.video_url,
        type: AssetType.AiVideo,
      }, `${volcengineAiLog.model}`)
      content.video_url = result.asset.path
    }

    const duration = (updated_at * 1000) - volcengineAiLog.startedAt.getTime()
    const failureMessage = this.getFailureMessage(status, callbackData)

    const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(volcengineAiLog.id, AiLogStatus.Generating, {
      $set: {
        status: aiLogStatus,
        response: callbackData,
        duration,
        errorMessage: failureMessage,
      },
    })

    if (!updatedAiLog) {
      return
    }

    if (aiLogStatus === AiLogStatus.Success || aiLogStatus === AiLogStatus.Failed) {
      await this.aiAvailability.recordAsyncComplete(
        id,
        { provider: 'volcengine', operation: 'videoGeneration', model: volcengineAiLog.model },
        {
          success: aiLogStatus === AiLogStatus.Success,
          latencyMs: duration,
          errorMessage: aiLogStatus === AiLogStatus.Failed ? failureMessage : undefined,
        },
      )
    }
  }

  /**
   * 查询Volcengine任务结果
   */
  getTaskResult(result: GetVideoGenerationTaskResponse | VolcengineCallbackDto) {
    const status = {
      [VolcTaskStatus.Succeeded]: TaskStatus.Success,
      [VolcTaskStatus.Queued]: TaskStatus.Submitted,
      [VolcTaskStatus.Running]: TaskStatus.InProgress,
      [VolcTaskStatus.Failed]: TaskStatus.Failure,
      [VolcTaskStatus.Cancelled]: TaskStatus.Failure,
      [VolcTaskStatus.Expired]: TaskStatus.Failure,
    }[result.status]

    return {
      status,
      videoUrl: result.content?.video_url ? FileUtil.buildUrl(result.content.video_url) : undefined,
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  extractInput(request: VolcengineVideoAiLog['request']) {
    const content = request.content as Content[]
    let prompt = ''
    let image: string | string[] | undefined

    const images: string[] = []
    const videos: string[] = []
    const audios: string[] = []

    if (content && Array.isArray(content)) {
      const textContent = content.find(c => c.type === ContentType.Text)
      if (textContent && textContent.text) {
        const parsed = parseModelTextCommand(textContent.text)
        prompt = parsed.prompt
      }

      content.forEach((item) => {
        switch (item.type) {
          case ContentType.ImageUrl:
            if (item.image_url?.url) {
              images.push(item.image_url.url)
            }
            break
          case ContentType.VideoUrl:
            if (item.video_url?.url) {
              videos.push(item.video_url.url)
            }
            break
          case ContentType.AudioUrl:
            if (item.audio_url?.url) {
              audios.push(item.audio_url.url)
            }
            break
          default:
            break
        }
      })

      const firstFrameImage = content.find((c): c is Extract<Content, { type: ContentType.ImageUrl }> => (
        c.type === ContentType.ImageUrl && (!c.role || c.role === ImageRole.FirstFrame)
      ))
      if (firstFrameImage?.image_url?.url) {
        image = firstFrameImage.image_url.url
      }
      else if (images.length === 1) {
        image = images[0]
      }
      else if (images.length > 1) {
        image = images
      }
    }

    return {
      prompt,
      image,
      images: images.length > 0 ? images : undefined,
      videoUrl: videos[0],
      videos: videos.length > 0 ? videos : undefined,
      audios: audios.length > 0 ? audios : undefined,
      duration: request.duration,
      aspectRatio: request.ratio,
      resolution: request.resolution,
      watermark: request.watermark,
    }
  }

  async getTask(userId: string, userType: UserType, taskId: string) {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const volcengineAiLog = aiLog as VolcengineVideoAiLog

    if (volcengineAiLog.status === AiLogStatus.Generating) {
      const result = await this.volcengineLibService.getVideoGenerationTask(volcengineAiLog.taskId!)
      if (
        result.status === VolcTaskStatus.Succeeded
        || result.status === VolcTaskStatus.Failed
        || result.status === VolcTaskStatus.Expired
      ) {
        await this.callback(result)
      }
      return result
    }
    return volcengineAiLog.response!
  }
}
