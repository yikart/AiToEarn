import type { MiniMaxVideoAiLog } from '../video-ai-log.interface'
import type { UserVideoGenerationRequestDto } from '../video.dto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AiLogSettlementSettledBy } from '@yikart/aitoearn-ai-shared'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService, StorageProvider } from '@yikart/assets'
import { AppException, CreditsConsumptionSource, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLog, AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import {
  MiniMaxCreateVideoTaskRequest,
  MiniMaxQueryVideoTaskResponse,
  MiniMaxService as MiniMaxLibService,
  MiniMaxVideoTaskStatus,
} from '../../libs/minimax'
import { ModelsConfigService } from '../../models-config'
import { AsyncSettlementService } from '../../settlement'

export interface MiniMaxVideoCallbackDto {
  id: string
  status: MiniMaxVideoTaskStatus
  providerModel?: string
  fileId?: string
  videoUrl?: string
  videoWidth?: number
  videoHeight?: number
  error?: string
}

interface MiniMaxVideoModelConfig {
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
export class MiniMaxVideoService {
  private readonly logger = new Logger(MiniMaxVideoService.name)

  constructor(
    private readonly minimaxLibService: MiniMaxLibService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly storageProvider: StorageProvider,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly queueService: QueueService,
    private readonly asyncSettlementService: AsyncSettlementService,
  ) {}

  private getModelConfig(model: string): MiniMaxVideoModelConfig {
    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig || modelConfig.channel !== AiLogChannel.MiniMax) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return modelConfig as MiniMaxVideoModelConfig
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

  private resolveMode(request: UserVideoGenerationRequestDto, modelConfig: MiniMaxVideoModelConfig, imageUrls: string[]): string {
    if (request.mode) {
      if (!modelConfig.modes.includes(request.mode)) {
        throw new AppException(ResponseCode.InvalidModel)
      }
      return request.mode
    }

    if (request.image_tail || imageUrls.length >= 2) {
      return 'flf2video'
    }

    if (imageUrls.length === 1) {
      return 'image2video'
    }

    return 'text2video'
  }

  private getProviderModel(modelConfig: MiniMaxVideoModelConfig, mode: string): string {
    const providerModel = modelConfig.modeMappings?.[mode]
    if (!providerModel) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return providerModel
  }

  private getPrice(modelConfig: MiniMaxVideoModelConfig, resolution: string | undefined, duration: number | undefined, mode?: string): number {
    const pricing = modelConfig.pricing.find(item => item.resolution === resolution
      && item.duration === duration
      && (mode ? item.mode === mode || !item.mode : !item.mode))
    if (!pricing) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    return pricing.price
  }

  private async toAccessibleUrl(url: string): Promise<string> {
    const parsed = this.storageProvider.parsePathFromUrl(url)
    if (parsed.startsWith('http') || parsed.startsWith('data:')) {
      return url
    }
    return this.storageProvider.toPresignedUrl(url)
  }

  private async buildPayload(request: UserVideoGenerationRequestDto, modelConfig: MiniMaxVideoModelConfig): Promise<{
    providerModel: string
    mode: string
    payload: MiniMaxCreateVideoTaskRequest
    duration?: number
    resolution?: string
    firstFrameImage?: string
    lastFrameImage?: string
  }> {
    if (request.video_url || request.videos?.length || request.audios?.length) {
      throw new BadRequestException('MiniMax video generation only supports text/image inputs')
    }

    const imageUrls = this.collectImageUrls(request)
    const mode = this.resolveMode(request, modelConfig, imageUrls)
    if (!modelConfig.modes.includes(mode)) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    if (imageUrls.length > modelConfig.maxInputImages) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const providerModel = this.getProviderModel(modelConfig, mode)
    const duration = request.duration ?? modelConfig.defaults.duration
    const resolution = request.resolution ?? modelConfig.defaults.resolution
    const payload: MiniMaxCreateVideoTaskRequest = {
      model: providerModel,
      prompt: request.prompt,
      duration,
      resolution,
    }

    let firstFrameImage: string | undefined
    let lastFrameImage: string | undefined
    if (mode === 'image2video' || mode === 'flf2video') {
      firstFrameImage = imageUrls[0]
      if (!firstFrameImage) {
        throw new BadRequestException('MiniMax image-to-video requires an image')
      }
      payload.first_frame_image = await this.toAccessibleUrl(firstFrameImage)
    }

    if (mode === 'flf2video') {
      lastFrameImage = request.image_tail ?? imageUrls[1]
      if (!lastFrameImage) {
        throw new BadRequestException('MiniMax first-last-frame video requires image_tail or two images')
      }
      payload.last_frame_image = await this.toAccessibleUrl(lastFrameImage)
    }

    if (request.metadata?.['promptOptimizer'] != null) {
      payload.prompt_optimizer = Boolean(request.metadata['promptOptimizer'])
    }
    if (request.metadata?.['fastPretreatment'] != null) {
      payload.fast_pretreatment = Boolean(request.metadata['fastPretreatment'])
    }

    return {
      providerModel,
      mode,
      payload,
      duration,
      resolution,
      firstFrameImage,
      lastFrameImage,
    }
  }

  calculatePrice(params: { model: string, resolution?: string, duration?: number, mode?: string }): number {
    const modelConfig = this.getModelConfig(params.model)
    const resolution = params.resolution ?? modelConfig.defaults.resolution
    const duration = params.duration ?? modelConfig.defaults.duration
    return this.getPrice(modelConfig, resolution, duration, params.mode)
  }

  async createFromRequest(request: UserVideoGenerationRequestDto): Promise<{ id: string, points: number }> {
    const modelConfig = this.getModelConfig(request.model)
    const source = request.source ?? CreditsConsumptionSource.AiVideo
    const { providerModel, mode, payload, duration, resolution, firstFrameImage, lastFrameImage } = await this.buildPayload(request, modelConfig)
    const pricing = this.getPrice(modelConfig, resolution, duration, mode)
    const startedAt = new Date()
    const result = await this.minimaxLibService.createVideoTask(payload)
    const taskId = result.task_id
    if (!taskId) {
      throw new BadRequestException(result.base_resp?.status_msg || 'MiniMax task id is missing')
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
      channel: AiLogChannel.MiniMax,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      settlement: this.asyncSettlementService.createPendingSettlement(pricing, { source }),
      request: {
        model: request.model,
        providerModel,
        mode,
        prompt: request.prompt,
        image: firstFrameImage,
        imageTail: lastFrameImage,
        resolution,
        duration,
        promptOptimizer: payload.prompt_optimizer,
        fastPretreatment: payload.fast_pretreatment,
        groupId: request.groupId,
      },
      response: {
        id: taskId,
        status: MiniMaxVideoTaskStatus.Preparing,
        providerModel,
      },
      status: AiLogStatus.Generating,
    })

    return { id: aiLog.id, points: pricing }
  }

  private async enqueueTaskRefund(aiLog: AiLog): Promise<void> {
    await this.asyncSettlementService.markFailed(aiLog.id, {
      channel: aiLog.channel,
      action: aiLog.action,
      settledBy: AiLogSettlementSettledBy.MiniMaxCallback,
    })

    if (aiLog.userType !== UserType.User) {
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
  }

  private async failTask(aiLog: MiniMaxVideoAiLog, taskId: string, errorMessage: string, elapsedMs: number, status = MiniMaxVideoTaskStatus.Fail): Promise<MiniMaxVideoCallbackDto> {
    const callbackData: MiniMaxVideoCallbackDto = {
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
    return callbackData
  }

  private normalizeDownloadUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url
    }
    return `https://${url}`
  }

  async callback(queryResult: MiniMaxQueryVideoTaskResponse): Promise<MiniMaxVideoCallbackDto> {
    const taskId = queryResult.task_id
    const aiLog = await this.aiLogRepo.getByTaskId(taskId)
    if (!aiLog || aiLog.channel !== AiLogChannel.MiniMax) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const minimaxAiLog = aiLog as MiniMaxVideoAiLog

    if (minimaxAiLog.status !== AiLogStatus.Generating) {
      return minimaxAiLog.response!
    }

    const status = queryResult.status
    if (
      status === MiniMaxVideoTaskStatus.Preparing
      || status === MiniMaxVideoTaskStatus.Queueing
      || status === MiniMaxVideoTaskStatus.Processing
    ) {
      return {
        id: taskId,
        status,
        providerModel: minimaxAiLog.request.providerModel,
        fileId: queryResult.file_id,
        videoWidth: queryResult.video_width,
        videoHeight: queryResult.video_height,
      }
    }

    const elapsedMs = Date.now() - minimaxAiLog.startedAt.getTime()
    if (status === MiniMaxVideoTaskStatus.Success && queryResult.file_id) {
      const fileResult = await this.minimaxLibService.retrieveFile(queryResult.file_id)
      const downloadUrl = fileResult.file?.download_url
      if (!downloadUrl) {
        return this.failTask(minimaxAiLog, taskId, 'MiniMax task succeeded but no download URL returned', elapsedMs)
      }

      const uploaded = await this.assetsService.uploadFromUrl(minimaxAiLog.userId, {
        url: this.normalizeDownloadUrl(downloadUrl),
        type: AssetType.AiVideo,
      }, minimaxAiLog.model)

      const callbackData: MiniMaxVideoCallbackDto = {
        id: taskId,
        status,
        providerModel: minimaxAiLog.request.providerModel,
        fileId: queryResult.file_id,
        videoUrl: uploaded.asset.path,
        videoWidth: queryResult.video_width,
        videoHeight: queryResult.video_height,
      }

      await this.aiLogRepo.updateById(minimaxAiLog.id, {
        status: AiLogStatus.Success,
        response: callbackData,
        duration: elapsedMs,
      })

      await this.asyncSettlementService.settleSuccess(minimaxAiLog.id, minimaxAiLog.points, {
        channel: minimaxAiLog.channel,
        settledBy: AiLogSettlementSettledBy.MiniMaxCallback,
      })

      return callbackData
    }

    const errorMessage = status === MiniMaxVideoTaskStatus.Success
      ? 'MiniMax task succeeded but no file ID returned'
      : `MiniMax task ${status}`
    return this.failTask(minimaxAiLog, taskId, errorMessage, elapsedMs, status)
  }

  getTaskResult(result: MiniMaxVideoCallbackDto) {
    const status = {
      [MiniMaxVideoTaskStatus.Success]: TaskStatus.Success,
      [MiniMaxVideoTaskStatus.Fail]: TaskStatus.Failure,
      [MiniMaxVideoTaskStatus.Preparing]: TaskStatus.InProgress,
      [MiniMaxVideoTaskStatus.Queueing]: TaskStatus.InProgress,
      [MiniMaxVideoTaskStatus.Processing]: TaskStatus.InProgress,
    }[result.status]

    return {
      status,
      videoUrl: result.videoUrl ? FileUtil.buildUrl(result.videoUrl) : undefined,
      error: result.error ? { message: result.error } : undefined,
    }
  }

  extractInput(request: MiniMaxVideoAiLog['request']) {
    const image = request.imageTail
      ? [request.image, request.imageTail].filter((item): item is string => Boolean(item))
      : request.image
    return {
      prompt: request.prompt || '',
      image,
      duration: request.duration,
      resolution: request.resolution,
    }
  }
}
