import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { AicsoLibService, AicsoQueryResponse, AicsoTaskStatus } from '../../libs/aicso'
import { ModelsConfigService } from '../../models-config'

export interface AicsoVeoVideoCreateRequest {
  userId: string
  userType: UserType
  model: string
  prompt: string
  images?: string[]
  aspectRatio?: string
}

export interface AicsoVeoVideoCallbackDto {
  id: string
  status: AicsoTaskStatus
  videoUrl?: string
  error?: string
}

@Injectable()
export class AicsoVeoVideoService {
  private readonly logger = new Logger(AicsoVeoVideoService.name)

  constructor(
    private readonly aicsoLibService: AicsoLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
  ) {}

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

  async createVideo(request: AicsoVeoVideoCreateRequest) {
    const { userId, userType, model, prompt, images, aspectRatio } = request

    const pricing = this.calculatePrice({ model })

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

    const startedAt = new Date()

    const result = await this.aicsoLibService.createVideo({
      model,
      prompt,
      images,
      enhance_prompt: true,
      enable_upsample: true,
      aspect_ratio: aspectRatio || '16:9',
    })

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
      taskId: result.id,
      model,
      channel: AiLogChannel.AicsoVeo,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: { model, prompt, images, aspectRatio },
      status: AiLogStatus.Generating,
    })

    return {
      id: aiLog.id,
      requestId: result.id,
      points: pricing,
    }
  }

  /**
   * 回调处理：根据查询结果更新 AiLog，上传视频，失败退款
   */
  async callback(queryResult: AicsoQueryResponse): Promise<AicsoVeoVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByTaskId(queryResult.id)
    if (!aiLog || aiLog.channel !== AiLogChannel.AicsoVeo) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (aiLog.status !== AiLogStatus.Generating) {
      return aiLog.response as AicsoVeoVideoCallbackDto
    }

    this.logger.debug({ queryResult }, 'AicsoVeo callback')

    const videoUrl = queryResult.detail?.upsample_video_url || queryResult.detail?.video_url || queryResult.video_url

    if (queryResult.status === AicsoTaskStatus.Completed && videoUrl) {
      const uploaded = await this.assetsService.uploadFromUrl(aiLog.userId, {
        url: videoUrl,
        type: AssetType.AiVideo,
      }, aiLog.model)

      const elapsedMs = Date.now() - aiLog.startedAt.getTime()
      const callbackData: AicsoVeoVideoCallbackDto = {
        id: queryResult.id,
        status: AicsoTaskStatus.Completed,
        videoUrl: uploaded.asset.path,
      }

      await this.aiLogRepo.updateById(aiLog.id, {
        status: AiLogStatus.Success,
        response: callbackData,
        duration: elapsedMs,
      })

      return callbackData
    }

    if ((queryResult.status === AicsoTaskStatus.Completed && !videoUrl)
      || queryResult.status === AicsoTaskStatus.Failed) {
      const elapsedMs = Date.now() - aiLog.startedAt.getTime()
      const errorMessage = queryResult.detail?.error_message
        || queryResult.detail?.video_generation_error
        || (queryResult.status === AicsoTaskStatus.Completed ? 'Video generation completed but no video URL returned' : 'Video generation failed')
      const callbackData: AicsoVeoVideoCallbackDto = {
        id: queryResult.id,
        status: AicsoTaskStatus.Failed,
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

    return {
      id: queryResult.id,
      status: AicsoTaskStatus.Pending,
    }
  }

  /**
   * 将回调数据转为统一的任务结果格式
   */
  getTaskResult(result: AicsoVeoVideoCallbackDto) {
    const status = {
      [AicsoTaskStatus.Completed]: TaskStatus.Success,
      [AicsoTaskStatus.Failed]: TaskStatus.Failure,
      [AicsoTaskStatus.Pending]: TaskStatus.InProgress,
      [AicsoTaskStatus.Processing]: TaskStatus.InProgress,
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
      image: request['images'] as string[] | undefined,
      aspectRatio: request['aspectRatio'] as string | undefined,
    }
  }

  async getTask(userId: string, userType: UserType, logId: string): Promise<AicsoVeoVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(logId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.AicsoVeo) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (aiLog.status === AiLogStatus.Generating) {
      const result = await this.aicsoLibService.getVideoStatus(aiLog.taskId)
      return this.callback(result)
    }

    return aiLog.response as AicsoVeoVideoCallbackDto
  }
}
