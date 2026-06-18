import type { GrokVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, StorageProvider, VideoMetadataService } from '@yikart/assets'
import { AppException, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { AxiosError } from 'axios'
import { TaskStatus } from '../../../../common'
import { config } from '../../../../config'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import { GrokAspectRatio, GrokGetVideoStatusResponse, GrokLibService, GrokResolution, GrokVideoTaskStatus } from '../../libs/grok'

export interface GrokVideoCreateRequest {
  userId: string
  userType: UserType
  model: string
  prompt: string
  duration?: number
  aspectRatio?: string
  resolution?: string
  image?: string
  referenceImages?: string[]
  videoUrl?: string
}

export interface GrokVideoCallbackDto {
  status: GrokVideoTaskStatus
  videoUrl?: string
  error?: string
}

@Injectable()
export class GrokVideoService {
  private readonly logger = new Logger(GrokVideoService.name)

  constructor(
    private readonly grokLibService: GrokLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly storageProvider: StorageProvider,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly aiAvailability: AiAvailabilityService,
  ) { }

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
    const videoUrl = await this.toAccessibleUrl(request.video_url)
    const image = Array.isArray(request.image)
      ? undefined
      : await this.toAccessibleUrl(request.image)
    const referenceImageUrls = [
      ...(Array.isArray(request.image) ? request.image : []),
      ...(request.images ?? []),
    ]
    const referenceImages = referenceImageUrls.length > 0
      ? await Promise.all(referenceImageUrls.map(url => this.toAccessibleUrl(url) as Promise<string>))
      : undefined
    const result = await this.createVideo({
      userId: request.userId,
      userType: request.userType,
      model: request.model,
      prompt: request.prompt,
      duration: request.duration,
      aspectRatio: request.metadata?.['aspectRatio'] as string,
      resolution: request.metadata?.['resolution'] as string,
      image,
      referenceImages,
      videoUrl,
    })

    return { id: result.id }
  }

  private resolveVideoEditDuration(requestedDuration?: number, metadataDuration?: number): number | undefined {
    const normalizedMetadataDuration = Number(metadataDuration)
    if (Number.isFinite(normalizedMetadataDuration) && normalizedMetadataDuration > 0) {
      return Math.ceil(normalizedMetadataDuration)
    }

    return requestedDuration
  }

  async createVideo(request: GrokVideoCreateRequest) {
    const { userId, userType, model, prompt, duration, aspectRatio, resolution, image, referenceImages, videoUrl } = request

    let resolvedDuration = duration
    if (videoUrl) {
      const metadata = await this.videoMetadataService.probeVideoMetadata(videoUrl)
      resolvedDuration = this.resolveVideoEditDuration(duration, metadata.duration)
    }

    const startedAt = new Date()

    const result = await this.aiAvailability.executeAsync(
      { provider: 'grok', operation: 'videoGeneration', model },
      () => videoUrl
        ? this.grokLibService.editVideo({
            model,
            prompt,
            video: { url: videoUrl },
          })
        : this.grokLibService.createVideo({
            model,
            prompt,
            duration: resolvedDuration,
            aspect_ratio: aspectRatio as GrokAspectRatio,
            resolution: resolution as GrokResolution,
            image: image ? { url: image } : undefined,
            reference_images: referenceImages?.length ? referenceImages.map(url => ({ url })) : undefined,
          }),
      r => r.request_id,
    )

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.request_id,
      model,
      channel: AiLogChannel.Grok,
      startedAt,
      type: AiLogType.Video,
      request: { model, prompt, duration: resolvedDuration, aspectRatio, resolution, image, referenceImages, videoUrl },
      status: AiLogStatus.Generating,
    })

    return {
      id: aiLog.id,
      requestId: result.request_id,
    }
  }

  /**
   * 回调处理：根据 Grok API 查询结果更新 AiLog，上传视频，失败退款
   */
  async callback(result: GrokGetVideoStatusResponse, aiLog: GrokVideoAiLog): Promise<GrokVideoCallbackDto> {
    if (aiLog.status !== AiLogStatus.Generating) {
      return aiLog.response!
    }

    this.logger.log({ result, aiLogId: aiLog.id }, 'Grok callback')

    if (result.video?.url) {
      const downloadUrl = config.ai.grok?.proxyUrl
        ? `${config.ai.grok.proxyUrl}/${result.video.url}`
        : result.video.url

      const uploaded = await this.assetsService.uploadFromUrl(aiLog.userId, {
        url: downloadUrl,
        type: AssetType.AiVideo,
      }, aiLog.model)

      const elapsedMs = Date.now() - aiLog.startedAt.getTime()
      const callbackData: GrokVideoCallbackDto = {
        status: GrokVideoTaskStatus.Done,
        videoUrl: uploaded.asset.path,
      }

      const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(
        aiLog.id,
        AiLogStatus.Generating,
        {
          $set: {
            status: AiLogStatus.Success,
            response: callbackData,
            duration: elapsedMs,
          },
        },
      )

      if (!updatedAiLog) {
        return aiLog.response!
      }

      await this.aiAvailability.recordAsyncComplete(
        aiLog.taskId!,
        { provider: 'grok', operation: 'videoGeneration', model: aiLog.model },
        { success: true, latencyMs: elapsedMs },
      )

      return callbackData
    }

    const isTerminal = result.status === GrokVideoTaskStatus.Done
      || result.status === GrokVideoTaskStatus.Failed
      || result.status === GrokVideoTaskStatus.Expired

    if (isTerminal) {
      const errorMessage = result.status === GrokVideoTaskStatus.Done
        ? 'Video generation completed but no video URL returned'
        : result.status === GrokVideoTaskStatus.Expired
          ? 'Video generation task expired'
          : (result.error?.message || 'Video generation failed')

      const elapsedMs = Date.now() - aiLog.startedAt.getTime()
      const callbackData: GrokVideoCallbackDto = {
        status: GrokVideoTaskStatus.Failed,
        error: errorMessage,
      }

      const updatedAiLog = await this.aiLogRepo.updateByIdAndStatus(aiLog.id, AiLogStatus.Generating, {
        $set: {
          status: AiLogStatus.Failed,
          response: callbackData,
          duration: elapsedMs,
          errorMessage,
        },
      })

      if (!updatedAiLog) {
        return aiLog.response!
      }

      const isContentModeration = errorMessage.toLowerCase().includes('content moderation')

      await this.aiAvailability.recordAsyncComplete(
        aiLog.taskId!,
        { provider: 'grok', operation: 'videoGeneration', model: aiLog.model },
        { success: false, latencyMs: elapsedMs, errorMessage, isBusinessError: isContentModeration },
      )

      return callbackData
    }

    return { status: result.status ?? GrokVideoTaskStatus.Pending }
  }

  /**
   * 将回调数据转为统一的任务结果格式
   */
  getTaskResult(result: GrokVideoCallbackDto) {
    const status = {
      [GrokVideoTaskStatus.Done]: TaskStatus.Success,
      [GrokVideoTaskStatus.Failed]: TaskStatus.Failure,
      [GrokVideoTaskStatus.Expired]: TaskStatus.Failure,
      [GrokVideoTaskStatus.Pending]: TaskStatus.InProgress,
    }[result.status]

    return {
      status,
      videoUrl: result.videoUrl ? FileUtil.buildUrl(result.videoUrl) : undefined,
      error: result.error ? { message: result.error } : undefined,
    }
  }

  extractInput(request: GrokVideoAiLog['request']) {
    return {
      prompt: request.prompt || '',
      image: request.referenceImages ?? request.image,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
      resolution: request.resolution,
      videoUrl: request.videoUrl,
    }
  }

  /**
   * 用户查询任务状态（含实时查询 Grok API）
   */
  async getTask(userId: string, userType: UserType, logId: string): Promise<GrokVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(logId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Grok) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const grokAiLog = aiLog as GrokVideoAiLog

    if (grokAiLog.status !== AiLogStatus.Generating) {
      return grokAiLog.response!
    }
    try {
      const result = await this.grokLibService.getVideoStatus(grokAiLog.taskId!)
      return await this.callback(result, grokAiLog)
    }
    catch (e) {
      let errorMessage: string = (e as Error).message
      let code = '500'
      if (e instanceof AxiosError) {
        const status = e?.response?.status
        if (status && status >= 400 && status < 500) {
          const data = e.response?.data
          errorMessage = data?.error || data?.code || `Grok API error (${status})`
          code = data?.code || `HTTP_${status}`
        }
      }
      return await this.callback({
        status: GrokVideoTaskStatus.Failed,
        error: { code, message: errorMessage },
      }, grokAiLog)
    }
  }
}
