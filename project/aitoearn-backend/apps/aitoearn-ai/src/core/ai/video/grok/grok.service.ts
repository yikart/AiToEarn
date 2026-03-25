import { Injectable, Logger } from '@nestjs/common'
import { AssetsService, VideoMetadataService } from '@yikart/assets'
import { AppException, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLog, AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { config } from '../../../../config'
import { GrokAspectRatio, GrokGetVideoStatusResponse, GrokLibService, GrokResolution, GrokVideoTaskStatus } from '../../libs/grok'
import { ModelsConfigService } from '../../models-config'

export interface GrokVideoCreateRequest {
  userId: string
  userType: UserType
  model: string
  prompt: string
  duration?: number
  aspectRatio?: string
  resolution?: string
  imageUrl?: string
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
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly videoMetadataService: VideoMetadataService,
  ) { }

  calculatePrice(params: { model: string, duration?: number, mode?: string }): number {
    const { model, duration, mode } = params

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const defaults = modelConfig.defaults || {}
    const finalDuration = duration || defaults.duration

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const durationMatch = !pricing.duration || !finalDuration || pricing.duration === finalDuration
      const modeMatch = mode ? pricing.mode === mode : !pricing.mode
      return durationMatch && modeMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  async createVideo(request: GrokVideoCreateRequest) {
    const { userId, userType, model, prompt, duration, aspectRatio, resolution, imageUrl, videoUrl } = request

    let pricing: number
    if (videoUrl) {
      const metadata = await this.videoMetadataService.probeVideoMetadata(videoUrl)
      const roundedDuration = Math.ceil(metadata.duration)
      pricing = this.calculatePrice({ model, duration: roundedDuration, mode: 'video2video' })
    }
    else {
      pricing = this.calculatePrice({ model, duration })
    }

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

    const startedAt = new Date()

    const result = await (videoUrl
      ? this.grokLibService.editVideo({
          model,
          prompt,
          video: { url: videoUrl },
        })
      : this.grokLibService.createVideo({
          model,
          prompt,
          duration,
          aspect_ratio: aspectRatio as GrokAspectRatio,
          resolution: resolution as GrokResolution,
          image: imageUrl ? { url: imageUrl } : undefined,
        }))

    if (userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: pricing,
        type: CreditsType.AiService,
        description: model,
      })
    }

    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.request_id,
      model,
      channel: AiLogChannel.Grok,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: { model, prompt, duration, aspectRatio, resolution, imageUrl, videoUrl },
      status: AiLogStatus.Generating,
    })

    return {
      id: aiLog.id,
      requestId: result.request_id,
      points: pricing,
    }
  }

  /**
   * 回调处理：根据 Grok API 查询结果更新 AiLog，上传视频，失败退款
   */
  async callback(result: GrokGetVideoStatusResponse, aiLog: AiLog): Promise<GrokVideoCallbackDto> {
    if (aiLog.status !== AiLogStatus.Generating) {
      return aiLog.response as GrokVideoCallbackDto
    }

    this.logger.log({ result, aiLogId: aiLog.id }, 'Grok callback')

    if (result.video?.url) {
      const downloadUrl = config.ai.grok.proxyUrl
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

      await this.aiLogRepo.updateById(aiLog.id, {
        status: AiLogStatus.Success,
        response: callbackData,
        duration: elapsedMs,
      })

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

      await this.aiLogRepo.updateById(aiLog.id, {
        status: AiLogStatus.Failed,
        response: callbackData,
        duration: elapsedMs,
        errorMessage,
      })

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

  extractInput(request: Record<string, unknown>) {
    return {
      prompt: (request['prompt'] as string) || '',
      image: request['imageUrl'] as string | undefined,
      duration: request['duration'] as number | undefined,
      aspectRatio: request['aspectRatio'] as string | undefined,
      resolution: request['resolution'] as string | undefined,
      videoUrl: request['videoUrl'] as string | undefined,
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

    if (aiLog.status !== AiLogStatus.Generating) {
      return aiLog.response as GrokVideoCallbackDto
    }

    const result = await this.grokLibService.getVideoStatus(aiLog.taskId)
    return this.callback(result, aiLog)
  }
}
