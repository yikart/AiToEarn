import type { DashscopeVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AiLogSettlementSettledBy } from '@yikart/aitoearn-ai-shared'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService, StorageProvider, VideoMetadataService } from '@yikart/assets'
import { AppException, CreditsConsumptionSource, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLog, AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import {
  DashscopeCreateVideoTaskRequest,
  DashscopeService as DashscopeLibService,
  DashscopeQueryVideoTaskResponse,
  DashscopeTaskStatus,
} from '../../libs/dashscope'
import { ModelsConfigService } from '../../models-config'
import { AsyncSettlementService } from '../../settlement'

export interface DashscopeVideoCallbackDto {
  id: string
  status: DashscopeTaskStatus
  requestId?: string
  providerModel?: string
  videoUrl?: string
  usage?: DashscopeQueryVideoTaskResponse['usage']
  error?: string
}

interface DashscopeModelConfig {
  name: string
  defaults: {
    resolution?: string
    aspectRatio?: string
    duration?: number
  }
  durations: number[]
  maxInputImages: number
  pricing: Array<{
    resolution?: string
    mode?: string
    duration?: number
    price: number
  }>
  modes: string[]
  modeMappings?: Record<string, string>
}

@Injectable()
export class DashscopeVideoService {
  private readonly logger = new Logger(DashscopeVideoService.name)

  constructor(
    private readonly dashscopeLibService: DashscopeLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly storageProvider: StorageProvider,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly queueService: QueueService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly aiAvailability: AiAvailabilityService,
    private readonly asyncSettlementService: AsyncSettlementService,
  ) {}

  private async enqueueTaskRefund(aiLog: AiLog): Promise<void> {
    await this.asyncSettlementService.markFailed(aiLog.id, {
      channel: aiLog.channel,
      action: aiLog.action,
      settledBy: AiLogSettlementSettledBy.DashscopeCallback,
    })

    if (aiLog.userType !== UserType.User) {
      return
    }

    if (!aiLog.taskId) {
      this.logger.error({ aiLogId: aiLog.id, userId: aiLog.userId }, 'Cannot enqueue refund: missing taskId')
      return
    }

    await this.queueService.addAiTaskRefundJob({
      userId: aiLog.userId,
      taskId: aiLog.id,
      amount: aiLog.points,
      description: aiLog.model,
      expiredAt: null,
      metadata: {
        channel: aiLog.channel,
        action: aiLog.action,
        failedAt: new Date().toISOString(),
      },
    })

    this.logger.log({ userId: aiLog.userId, taskId: aiLog.taskId, amount: aiLog.points }, 'Enqueued AI task refund')
  }

  private getModelConfig(model: string): DashscopeModelConfig {
    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return modelConfig as DashscopeModelConfig
  }

  private getPrice(modelConfig: DashscopeModelConfig, resolution: string | undefined, duration: number | undefined, mode?: string): number {
    const pricing = modelConfig.pricing.find(item => item.resolution === resolution
      && item.duration === duration
      && (mode ? item.mode === mode : !item.mode))
    if (!pricing) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return pricing.price
  }

  private getProviderModel(modelConfig: DashscopeModelConfig, mode: string): string {
    const providerModel = modelConfig.modeMappings?.[mode]
    if (!providerModel) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return providerModel
  }

  private async toAccessibleUrl(url: string): Promise<string> {
    const parsed = this.storageProvider.parsePathFromUrl(url)
    if (parsed.startsWith('http')) {
      return url
    }
    return this.storageProvider.toPresignedUrl(url)
  }

  private collectImageUrls(request: UserVideoGenerationRequestDto): string[] {
    const imageUrls: string[] = []
    if (request.image) {
      if (Array.isArray(request.image)) {
        imageUrls.push(...request.image)
      }
      else {
        imageUrls.push(request.image)
      }
    }
    if (request.images) {
      imageUrls.push(...request.images)
    }
    return imageUrls
  }

  private resolveMode(request: UserVideoGenerationRequestDto, modelConfig: DashscopeModelConfig, imageUrls: string[]): string {
    if (request.video_url || request.videos?.[0]) {
      return 'video2video'
    }

    if (request.mode) {
      if (!modelConfig.modes.includes(request.mode)) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      return request.mode
    }

    if (imageUrls.length === 0) {
      return 'text2video'
    }

    return imageUrls.length === 1 ? 'image2video' : 'multi-image2video'
  }

  private getMaxDuration(modelConfig: DashscopeModelConfig): number {
    const maxDuration = Math.max(...modelConfig.durations)
    if (!Number.isFinite(maxDuration)) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return maxDuration
  }

  private async resolveVideoDuration(request: UserVideoGenerationRequestDto, modelConfig: DashscopeModelConfig, videoUrl: string | undefined): Promise<number | undefined> {
    if (request.duration != null) {
      return request.duration
    }

    if (!videoUrl) {
      return modelConfig.defaults.duration
    }

    const metadata = await this.videoMetadataService.probeVideoMetadata(FileUtil.buildUrl(videoUrl))
    const metadataDuration = Number(metadata.duration)
    if (!Number.isFinite(metadataDuration) || metadataDuration <= 0) {
      throw new BadRequestException('video duration is required')
    }

    return Math.min(Math.ceil(metadataDuration), this.getMaxDuration(modelConfig))
  }

  private async buildPayload(request: UserVideoGenerationRequestDto, modelConfig: DashscopeModelConfig): Promise<{
    providerModel: string
    mode: string
    payload: DashscopeCreateVideoTaskRequest
    duration?: number
    resolution?: string
  }> {
    if (request.image_tail) {
      throw new BadRequestException('DashScope HappyHorse does not support image_tail')
    }

    const imageUrls = this.collectImageUrls(request)
    const videoUrl = request.video_url ?? request.videos?.[0]
    const mode = this.resolveMode(request, modelConfig, imageUrls)
    const providerModel = this.getProviderModel(modelConfig, mode)
    const resolution = request.resolution
    const ratio = request.ratio
    const duration = await this.resolveVideoDuration(request, modelConfig, mode === 'video2video' ? videoUrl : undefined)
    const prompt = request.prompt
    const parameters: NonNullable<DashscopeCreateVideoTaskRequest['parameters']> = {}
    if (resolution) {
      parameters.resolution = resolution
    }
    parameters.watermark = request.watermark ?? false
    if (request.seed != null) {
      parameters.seed = request.seed
    }
    const generationParameters = duration != null ? { ...parameters, duration } : parameters
    const generationParametersWithRatio = ratio ? { ...generationParameters, ratio } : generationParameters

    if (mode === 'text2video') {
      return {
        providerModel,
        mode,
        duration,
        resolution,
        payload: {
          model: providerModel,
          input: { prompt },
          parameters: generationParametersWithRatio,
        },
      }
    }

    if (mode === 'image2video') {
      if (imageUrls.length !== 1) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      return {
        providerModel,
        mode,
        duration,
        resolution,
        payload: {
          model: providerModel,
          input: {
            prompt,
            media: [{ type: 'first_frame', url: await this.toAccessibleUrl(imageUrls[0]) }],
          },
          parameters: generationParameters,
        },
      }
    }

    if (mode === 'multi-image2video') {
      if (imageUrls.length < 1 || imageUrls.length > modelConfig.maxInputImages) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      return {
        providerModel,
        mode,
        duration,
        resolution,
        payload: {
          model: providerModel,
          input: {
            prompt,
            media: await Promise.all(imageUrls.map(async url => ({ type: 'reference_image', url: await this.toAccessibleUrl(url) }))),
          },
          parameters: generationParametersWithRatio,
        },
      }
    }

    if (mode === 'video2video') {
      if (!videoUrl) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      if (imageUrls.length > 5) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      const media = [
        { type: 'video', url: await this.toAccessibleUrl(videoUrl) },
        ...await Promise.all(imageUrls.map(async url => ({ type: 'reference_image', url: await this.toAccessibleUrl(url) }))),
      ]
      return {
        providerModel,
        mode,
        duration,
        resolution,
        payload: {
          model: providerModel,
          input: { prompt, media },
          parameters,
        },
      }
    }

    throw new AppException(ResponseCode.InvalidModel)
  }

  async calculatePrice(params: { model: string, resolution?: string, duration?: number, mode?: string }): Promise<number> {
    const modelConfig = this.getModelConfig(params.model)
    const mode = params.mode === 'video2video' ? params.mode : undefined
    return this.getPrice(modelConfig, params.resolution, params.duration, mode)
  }

  async createFromRequest(request: UserVideoGenerationRequestDto): Promise<{ id: string, points: number }> {
    const modelConfig = this.getModelConfig(request.model)
    const source = request.source ?? CreditsConsumptionSource.AiVideo
    const { providerModel, mode, payload, duration, resolution } = await this.buildPayload(request, modelConfig)
    const pricingMode = mode === 'video2video' ? mode : undefined
    const pricing = this.getPrice(modelConfig, resolution, duration, pricingMode)

    const startedAt = new Date()
    const result = await this.aiAvailability.executeAsync(
      { provider: 'dashscope', operation: 'videoGeneration', model: providerModel },
      () => this.dashscopeLibService.createVideoTask(payload),
      response => response.output?.task_id ?? '',
    )

    const taskId = result.output?.task_id
    if (!taskId) {
      throw new BadRequestException(result.message || result.code || 'DashScope task id is missing')
    }

    if (request.userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId: request.userId,
        amount: pricing,
        type: CreditsType.AiService,
        source,
        description: request.model,
      })
    }

    const aiLog = await this.aiLogRepo.create({
      userId: request.userId,
      userType: request.userType,
      taskId,
      model: request.model,
      channel: AiLogChannel.Dashscope,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      settlement: this.asyncSettlementService.createPendingSettlement(pricing, { source }),
      request: {
        model: request.model,
        providerModel,
        mode,
        prompt: request.prompt,
        images: this.collectImageUrls(request),
        videoUrl: request.video_url ?? request.videos?.[0],
        resolution,
        ratio: request.ratio,
        duration,
        watermark: request.watermark,
        seed: request.seed,
      },
      response: {
        id: taskId,
        requestId: result.request_id,
        providerModel,
        status: result.output?.task_status ?? DashscopeTaskStatus.Pending,
      },
      status: AiLogStatus.Generating,
    })

    return { id: aiLog.id, points: pricing }
  }

  private async failTask(aiLog: DashscopeVideoAiLog, taskId: string, errorMessage: string, elapsedMs: number, status = DashscopeTaskStatus.Failed): Promise<DashscopeVideoCallbackDto> {
    const callbackData: DashscopeVideoCallbackDto = {
      id: taskId,
      status,
      providerModel: aiLog.request.providerModel,
      error: errorMessage,
    }

    await this.aiLogRepo.updateById(aiLog.id, {
      status: AiLogStatus.Failed,
      response: callbackData,
      duration: elapsedMs,
      errorMessage,
    })

    await this.enqueueTaskRefund(aiLog)

    await this.aiAvailability.recordAsyncComplete(
      taskId,
      { provider: 'dashscope', operation: 'videoGeneration', model: aiLog.request.providerModel ?? aiLog.model },
      { success: false, latencyMs: elapsedMs, errorMessage },
    )

    return callbackData
  }

  async callback(queryResult: DashscopeQueryVideoTaskResponse): Promise<DashscopeVideoCallbackDto> {
    const taskId = queryResult.output.task_id
    const aiLog = await this.aiLogRepo.getByTaskId(taskId)
    if (!aiLog || aiLog.channel !== AiLogChannel.Dashscope) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const dashscopeAiLog = aiLog as DashscopeVideoAiLog

    if (dashscopeAiLog.status !== AiLogStatus.Generating) {
      return dashscopeAiLog.response!
    }

    const status = queryResult.output.task_status
    if (status === DashscopeTaskStatus.Pending || status === DashscopeTaskStatus.Running) {
      return {
        id: taskId,
        status,
        requestId: queryResult.request_id,
        providerModel: dashscopeAiLog.request.providerModel,
      }
    }

    const elapsedMs = Date.now() - dashscopeAiLog.startedAt.getTime()

    if (status === DashscopeTaskStatus.Succeeded && queryResult.output.video_url) {
      const pricingMode = dashscopeAiLog.request.mode === 'video2video' ? dashscopeAiLog.request.mode : undefined
      const usageDuration = pricingMode
        ? queryResult.usage?.output_video_duration
        : queryResult.usage?.duration
      if (usageDuration == null) {
        const errorMessage = pricingMode
          ? 'DashScope video edit output duration is required'
          : 'DashScope usage.duration is required'
        return this.failTask(dashscopeAiLog, taskId, errorMessage, elapsedMs)
      }

      let actualPoints: number
      try {
        actualPoints = this.getPrice(this.getModelConfig(dashscopeAiLog.model), dashscopeAiLog.request.resolution, Math.ceil(usageDuration), pricingMode)
      }
      catch (e) {
        this.logger.debug({ taskId, dashscopeAiLog, result: queryResult }, 'DashScope usage.duration does not match model pricing')
        this.logger.error(e, `DashScope usage.duration does not match model pricing, taskId: ${taskId}`)
        return this.failTask(dashscopeAiLog, taskId, 'DashScope usage.duration does not match model pricing', elapsedMs)
      }

      const uploaded = await this.assetsService.uploadFromUrl(dashscopeAiLog.userId, {
        url: queryResult.output.video_url,
        type: AssetType.AiVideo,
      }, dashscopeAiLog.model)

      const callbackData: DashscopeVideoCallbackDto = {
        id: taskId,
        status,
        requestId: queryResult.request_id,
        providerModel: dashscopeAiLog.request.providerModel,
        videoUrl: uploaded.asset.path,
        usage: queryResult.usage,
      }

      await this.aiLogRepo.updateById(dashscopeAiLog.id, {
        status: AiLogStatus.Success,
        response: callbackData,
        duration: elapsedMs,
      })

      await this.asyncSettlementService.settleSuccess(dashscopeAiLog.id, actualPoints, {
        channel: dashscopeAiLog.channel,
        settledBy: AiLogSettlementSettledBy.DashscopeCallback,
      })

      await this.aiAvailability.recordAsyncComplete(
        taskId,
        { provider: 'dashscope', operation: 'videoGeneration', model: dashscopeAiLog.request.providerModel ?? dashscopeAiLog.model },
        { success: true, latencyMs: elapsedMs },
      )

      return callbackData
    }

    const errorMessage = queryResult.output.message
      || queryResult.output.code
      || (status === DashscopeTaskStatus.Succeeded ? 'DashScope task succeeded but no video URL returned' : `DashScope task ${status}`)
    return status === DashscopeTaskStatus.Succeeded
      ? this.failTask(dashscopeAiLog, taskId, errorMessage, elapsedMs)
      : this.failTask(dashscopeAiLog, taskId, errorMessage, elapsedMs, status)
  }

  getTaskResult(result: DashscopeVideoCallbackDto) {
    const status = {
      [DashscopeTaskStatus.Succeeded]: TaskStatus.Success,
      [DashscopeTaskStatus.Failed]: TaskStatus.Failure,
      [DashscopeTaskStatus.Canceled]: TaskStatus.Failure,
      [DashscopeTaskStatus.Unknown]: TaskStatus.Failure,
      [DashscopeTaskStatus.Pending]: TaskStatus.InProgress,
      [DashscopeTaskStatus.Running]: TaskStatus.InProgress,
    }[result.status]

    return {
      status,
      videoUrl: result.videoUrl ? FileUtil.buildUrl(result.videoUrl) : undefined,
      error: result.error ? { message: result.error } : undefined,
    }
  }

  extractInput(request: DashscopeVideoAiLog['request']) {
    const image = !request.images?.length
      ? undefined
      : request.images.length === 1
        ? request.images[0]
        : request.images

    return {
      prompt: request.prompt || '',
      image,
      images: request.images,
      videoUrl: request.videoUrl,
      duration: request.duration,
      resolution: request.resolution,
      aspectRatio: request.ratio,
      watermark: request.watermark,
    }
  }
}
