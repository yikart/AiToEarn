import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { config } from '../../../../config'
import {
  ContentType,
  CreateVideoGenerationTaskResponse,
  GetVideoGenerationTaskResponse,
  parseModelTextCommand,
  VolcengineService as VolcengineLibService,
  TaskStatus as VolcTaskStatus,
} from '../../libs/volcengine'
import { ModelsConfigService } from '../../models-config'
import { UserVolcengineGenerationRequestDto, VolcengineCallbackDto } from './volcengine.dto'

@Injectable()
export class VolcengineVideoService {
  private readonly logger = new Logger(VolcengineVideoService.name)

  constructor(
    private readonly volcengineLibService: VolcengineLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
  ) {}

  async calculatePrice(params: {
    model: string
    userId?: string
    userType?: UserType
    aspectRatio?: string
    resolution?: string
    duration?: number
  }): Promise<number> {
    const { model, aspectRatio, resolution, duration } = params

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const defaults = modelConfig.defaults || {}
    const finalAspectRatio = aspectRatio || defaults.aspectRatio
    const finalResolution = resolution || defaults.resolution
    const finalDuration = duration || defaults.duration

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const aspectRatioMatch = !pricing.aspectRatio || !finalAspectRatio || pricing.aspectRatio === finalAspectRatio
      const resolutionMatch = !pricing.resolution || !finalResolution || pricing.resolution === finalResolution
      const durationMatch = !pricing.duration || !finalDuration || pricing.duration === finalDuration
      return aspectRatioMatch && resolutionMatch && durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  /**
   * Volcengine视频生成
   */
  async create(request: UserVolcengineGenerationRequestDto) {
    const { userId, userType, model, content, ...params } = request

    const textContent = content.find(c => c.type === ContentType.Text)
    const prompt = textContent && 'text' in textContent ? textContent.text : undefined

    if (!prompt) {
      throw new BadRequestException('prompt is required')
    }

    const { params: modelParams } = parseModelTextCommand(prompt)

    const pricing = await this.calculatePrice({
      userId,
      userType,
      aspectRatio: modelParams.ratio,
      resolution: modelParams.resolution,
      duration: modelParams.duration,
      model,
    })

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.volcengineLibService.createVideoGenerationTask({
      ...params,
      model,
      content,
      callback_url: config.ai.volcengine.callbackUrl,
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
      channel: AiLogChannel.Volcengine,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      request: {
        ...params,
        model,
        content,
      },
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
  async callback(callbackData: VolcengineCallbackDto) {
    const { id, status, updated_at, content } = callbackData

    const aiLog = await this.aiLogRepo.getByTaskId(id)
    if (!aiLog || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (aiLog.status !== AiLogStatus.Generating && status !== VolcTaskStatus.Succeeded && status !== VolcTaskStatus.Failed) {
      return
    }

    let aiLogStatus: AiLogStatus
    switch (status) {
      case VolcTaskStatus.Succeeded:
        aiLogStatus = AiLogStatus.Success
        break
      case VolcTaskStatus.Failed:
        aiLogStatus = AiLogStatus.Failed
        break
      default:
        aiLogStatus = AiLogStatus.Generating
        break
    }

    if (content) {
      if (content.last_frame_url) {
        const result = await this.assetsService.uploadFromUrl(aiLog.userId, {
          url: content.last_frame_url,
          type: AssetType.AiImage,
        }, `${aiLog.model}`)
        content.last_frame_url = result.asset.path
      }

      const result = await this.assetsService.uploadFromUrl(aiLog.userId, {
        url: content.video_url,
        type: AssetType.AiVideo,
      }, `${aiLog.model}`)
      content.video_url = result.asset.path
    }

    const duration = (updated_at * 1000) - aiLog.startedAt.getTime()

    await this.aiLogRepo.updateById(aiLog.id, {
      status: aiLogStatus,
      response: callbackData,
      duration,
      errorMessage: status === 'failed' ? callbackData.error?.message : undefined,
    })

    if (aiLogStatus === AiLogStatus.Failed) {
    }
  }

  /**
   * 查询Volcengine任务结果
   */
  getTaskResult(result: GetVideoGenerationTaskResponse) {
    const status = {
      [VolcTaskStatus.Succeeded]: TaskStatus.Success,
      [VolcTaskStatus.Queued]: TaskStatus.Submitted,
      [VolcTaskStatus.Running]: TaskStatus.InProgress,
      [VolcTaskStatus.Failed]: TaskStatus.Failure,
      [VolcTaskStatus.Cancelled]: TaskStatus.Failure,
    }[result.status]

    return {
      status,
      videoUrl: result.content?.video_url ? FileUtil.buildUrl(result.content.video_url) : undefined,
      error: result.error ? { message: result.error.message } : undefined,
    }
  }

  extractInput(request: Record<string, unknown>) {
    const content = request['content'] as Array<{ type: string, text?: string, image_url?: { url: string } }> | undefined
    let prompt = ''
    let image: string | undefined

    if (content && Array.isArray(content)) {
      const textContent = content.find(c => c.type === ContentType.Text)
      if (textContent && textContent.text) {
        const parsed = parseModelTextCommand(textContent.text)
        prompt = parsed.prompt
      }
      const imageContent = content.find(c => c.type === ContentType.ImageUrl)
      if (imageContent && imageContent.image_url) {
        image = imageContent.image_url.url
      }
    }

    return { prompt, image }
  }

  async getTask(userId: string, userType: UserType, taskId: string) {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(taskId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Volcengine) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    if (aiLog.status === AiLogStatus.Generating) {
      const result = await this.volcengineLibService.getVideoGenerationTask(aiLog.taskId)
      if (result.status === VolcTaskStatus.Succeeded || result.status === VolcTaskStatus.Failed) {
        await this.callback(result)
      }
      return result
    }
    return aiLog.response as unknown as GetVideoGenerationTaskResponse
  }
}
