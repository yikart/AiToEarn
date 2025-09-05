import { Injectable } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { config } from '../../config'
import { VideoService as NewApiVideoService, VideoTaskStatusResponse } from '../../libs/new-api'
import { UserVideoGenerationRequestDto, UserVideoTaskQueryDto } from './video.dto'

@Injectable()
export class VideoService {
  constructor(
    private readonly videoService: NewApiVideoService,
    private readonly userClient: AitoearnUserClient,
    private readonly aiLogRepo: AiLogRepository,
  ) {}

  async calculateVideoGenerationPrice(params: {
    model: string
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }): Promise<number> {
    const { model } = params

    // 查找对应的模型配置
    const modelConfig = config.ai.models.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const { resolution, aspectRatio, mode, duration } = {
      ...modelConfig.defaults,
      ...params,
    }

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const resolutionMatch = !pricing.resolution || !resolution || pricing.resolution === resolution
      const aspectRatioMatch = !pricing.aspectRatio || !aspectRatio || pricing.aspectRatio === aspectRatio
      const modeMatch = !pricing.mode || !mode || pricing.mode === mode
      const durationMatch = !pricing.duration || !duration || pricing.duration === duration

      return resolutionMatch && aspectRatioMatch && modeMatch && durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration({ userId, userType, ...params }: UserVideoGenerationRequestDto) {
    const pricing = await this.calculateVideoGenerationPrice({
      model: params.model,
      resolution: params.size,
      duration: params.duration,
    })
    if (userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.videoService.submitVideoGeneration({
      apiKey: config.ai.newApi.apiKey,
      ...params,
    })

    await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.task_id,
      model: params.model,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: params,
      response: result as unknown as Record<string, unknown>,
      status: AiLogStatus.Generating,
    })

    return result
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const { taskId } = request

    const aiLog = await this.aiLogRepo.getByTaskId(taskId)
    if (aiLog == null) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    if (aiLog.status === AiLogStatus.Generating) {
      const result = await this.videoService.getVideoTaskStatus({
        apiKey: config.ai.newApi.apiKey,
        taskId,
      })
      return result
    }
    return aiLog.response as unknown as VideoTaskStatusResponse
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams() {
    return config.ai.models.video.generation
  }
}
