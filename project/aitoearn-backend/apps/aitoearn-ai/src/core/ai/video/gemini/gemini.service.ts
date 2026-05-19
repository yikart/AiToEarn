import type { GeminiVideoAiLog } from '../video-ai-log.interface'
import {
  GenerateVideosConfig,
  GenerateVideosOperation,
  GenerateVideosParameters,
  Image,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai'
import { Injectable, Logger } from '@nestjs/common'
import { AiLogSettlementSettledBy } from '@yikart/aitoearn-ai-shared'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsConsumptionSource, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLog, AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import { GeminiService } from '../../libs/gemini'
import { ModelsConfigService } from '../../models-config'
import { AsyncSettlementService } from '../../settlement'
import { GeminiVeoVideoCallbackDto, UserGeminiVeoVideoCreateRequestDto } from './gemini.dto'

@Injectable()
export class GeminiVideoService {
  private readonly logger = new Logger(GeminiVideoService.name)

  constructor(
    private readonly geminiLibService: GeminiService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly assetsService: AssetsService,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly creditsHelper: CreditsHelperService,
    private readonly queueService: QueueService,
    private readonly aiAvailability: AiAvailabilityService,
    private readonly asyncSettlementService: AsyncSettlementService,
  ) { }

  private async enqueueTaskRefund(aiLog: AiLog): Promise<void> {
    await this.asyncSettlementService.markFailed(aiLog.id, {
      channel: aiLog.channel,
      action: aiLog.action,
      settledBy: AiLogSettlementSettledBy.GeminiCallback,
    })

    if (aiLog.userType !== UserType.User) {
      return
    }

    if (!aiLog.taskId) {
      this.logger.error(
        { aiLogId: aiLog.id, userId: aiLog.userId },
        'Cannot enqueue refund: missing taskId',
      )
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

    this.logger.log(
      { userId: aiLog.userId, taskId: aiLog.taskId, amount: aiLog.points },
      'Enqueued AI task refund',
    )
  }

  async calculatePrice(params: {
    model: string
    userId?: string
    userType?: UserType
    duration?: number
    resolution?: string
  }): Promise<number> {
    const { model, duration, resolution } = params

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const defaults = modelConfig.defaults || {}
    const finalDuration = duration || defaults.duration

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const durationMatch = !pricing.duration || !finalDuration || pricing.duration === finalDuration
      const resolutionMatch = !pricing.resolution || !resolution || pricing.resolution === resolution
      return durationMatch && resolutionMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    return pricingConfig.price
  }

  private generateGcsOutputFolder(userId: string, model: string, bucket: string): string {
    return `gs://${bucket}/videos/${userId}/${model}/`
  }

  private async resolveVideo(url: string): Promise<Video> {
    if (url.startsWith('gs://')) {
      return {
        uri: url,
        mimeType: 'video/mp4',
      }
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new AppException(ResponseCode.S3DownloadFileFailed)
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      videoBytes: buffer.toString('base64'),
      mimeType: contentType,
    }
  }

  private async resolveImage(url: string): Promise<Image> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new AppException(ResponseCode.S3DownloadFileFailed)
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      imageBytes: buffer.toString('base64'),
      mimeType: contentType,
    }
  }

  async createVideo(request: UserGeminiVeoVideoCreateRequestDto) {
    const { source = CreditsConsumptionSource.AiVideo, ...requestWithoutSource } = request
    const { userId, userType, model, prompt, seed, duration, negativePrompt, resolution } = requestWithoutSource

    const pricing = await this.calculatePrice({
      userId,
      userType,
      model,
      duration,
    })

    const startedAt = new Date()

    // 预选 Key Pair 获取 bucket
    const keyPairSelection = await this.geminiLibService.keyManager.selectKeyPair()
    const outputGcsUri = this.generateGcsOutputFolder(userId, model, keyPairSelection.bucket)

    const config: GenerateVideosConfig = {
      durationSeconds: duration,
      generateAudio: true,
      seed,
      negativePrompt,
      resolution,
      numberOfVideos: 1,
      outputGcsUri,
      personGeneration: 'allow_adult',
    }

    const params: GenerateVideosParameters = {
      prompt,
      model,
      config,
    }

    if ('image' in request || 'lastFrame' in request) {
      if (request.image)
        params.image = await this.resolveImage(request.image)
      if (request.lastFrame)
        config.lastFrame = await this.resolveImage(request.lastFrame)
      config.aspectRatio = request.aspectRatio || '16:9'
    }
    if ('video' in request && request.video) {
      params.video = await this.resolveVideo(request.video)
    }
    if ('referenceImages' in request && request.referenceImages?.length) {
      config.referenceImages = await Promise.all(
        request.referenceImages.map(async (url): Promise<VideoGenerationReferenceImage> => ({
          image: await this.resolveImage(url),
          referenceType: VideoGenerationReferenceType.ASSET,
        })),
      )
      config.aspectRatio = request.aspectRatio || '16:9'
    }

    const result = await this.aiAvailability.executeAsync(
      { provider: 'gemini', operation: 'videoGeneration', model },
      async () => {
        const r = await this.geminiLibService.createVideo(params)
        if (!r.operation.name || r.operation.error) {
          this.logger.error(r, 'Gemini Veo createVideo failed')
          throw new AppException(ResponseCode.AiCallFailed, r.operation.error)
        }
        return r
      },
      r => r.operation.name!,
    )

    if (userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: pricing,
        type: CreditsType.AiService,
        source,
        description: model,
      })
    }

    // keyPairId 存入 request 对象
    const aiLog = await this.aiLogRepo.create({
      userId,
      userType,
      taskId: result.operation.name,
      model,
      channel: AiLogChannel.Gemini,
      startedAt,
      type: AiLogType.Video,
      points: pricing,
      settlement: this.asyncSettlementService.createPendingSettlement(pricing, { source }),
      request: {
        ...requestWithoutSource,
        keyPairId: result.keyPairId,
      },
      response: result.operation,
      status: AiLogStatus.Generating,
    })

    return {
      id: aiLog.id,
      ...result.operation,
    }
  }

  async callback(operation: GenerateVideosOperation) {
    if (!operation.name) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const aiLog = await this.aiLogRepo.getByTaskId(operation.name)
    if (!aiLog || aiLog.channel !== AiLogChannel.Gemini) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const geminiAiLog = aiLog as GeminiVideoAiLog

    if (geminiAiLog.status !== AiLogStatus.Generating) {
      return geminiAiLog.response!
    }

    this.logger.debug(operation, `Gemini Veo callback`)

    let aiLogStatus: AiLogStatus
    const generatedVideos: { url: string, gcsUrl: string | null }[] = []

    // 从 request 读取 keyPairId
    const requestData = geminiAiLog.request
    const keyPairId = requestData.keyPairId || this.geminiLibService.keyManager.getDefaultKeyPairId()

    if (!requestData.keyPairId) {
      this.logger.warn(
        { aiLogId: geminiAiLog.id, taskId: geminiAiLog.taskId },
        'AiLog missing keyPairId, using default key pair for download',
      )
    }

    if (operation.error) {
      aiLogStatus = AiLogStatus.Failed
    }
    else if (operation.done && operation.response?.generatedVideos) {
      aiLogStatus = AiLogStatus.Success

      for (const videoData of operation.response.generatedVideos) {
        const video = videoData.video
        if (!video)
          continue

        let buffer: Buffer
        let gcsUrl: string | null = null

        // 优先从 GCS URI 下载（使用 keyPairId 对应的 storage client）
        if (video.uri) {
          gcsUrl = video.uri
          buffer = await this.geminiLibService.downloadFromGcs(video.uri, keyPairId)
        }
        else if (video.videoBytes) {
          buffer = Buffer.from(video.videoBytes, 'base64')
        }
        else {
          continue
        }

        const uploadResult = await this.assetsService.uploadFromBuffer(geminiAiLog.userId, buffer, {
          type: AssetType.AiVideo,
          mimeType: video.mimeType || 'video/mp4',
        }, `${geminiAiLog.model}`)

        generatedVideos.push({
          url: uploadResult.asset.path,
          gcsUrl,
        })
      }
    }
    else {
      aiLogStatus = AiLogStatus.Generating
    }

    const duration = Date.now() - geminiAiLog.startedAt.getTime()
    const completedAt = aiLogStatus !== AiLogStatus.Generating ? new Date() : null

    const callbackData: GeminiVeoVideoCallbackDto = {
      completedAt,
      status: aiLogStatus,
      generatedVideos,
      name: operation.name!,
      model: requestData.model,
      prompt: requestData.prompt,
      createdAt: geminiAiLog.startedAt,
      error: operation.error,
    }

    await this.aiLogRepo.updateById(geminiAiLog.id, {
      status: aiLogStatus,
      response: callbackData,
      duration,
      errorMessage: operation.error?.['message'],
    })

    if (aiLogStatus === AiLogStatus.Success) {
      await this.asyncSettlementService.settleSuccess(geminiAiLog.id, geminiAiLog.points, {
        channel: geminiAiLog.channel,
        settledBy: AiLogSettlementSettledBy.GeminiCallback,
      })
    }

    if (aiLogStatus === AiLogStatus.Failed) {
      await this.enqueueTaskRefund(geminiAiLog)
    }

    if (aiLogStatus === AiLogStatus.Success || aiLogStatus === AiLogStatus.Failed) {
      await this.aiAvailability.recordAsyncComplete(
        operation.name!,
        { provider: 'gemini', operation: 'videoGeneration', model: geminiAiLog.model },
        {
          success: aiLogStatus === AiLogStatus.Success,
          latencyMs: duration,
          errorMessage: operation.error?.['message'] as string | undefined,
        },
      )
    }

    return callbackData
  }

  async getVideo(userId: string, userType: UserType, logId: string): Promise<GeminiVeoVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(logId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Gemini) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    const geminiAiLog = aiLog as GeminiVideoAiLog

    if (geminiAiLog.status === AiLogStatus.Generating) {
      const operation = await this.geminiLibService.getOperation(this.getOperation({ name: geminiAiLog.taskId! }))
      return this.callback(operation)
    }

    return geminiAiLog.response!
  }

  getTaskResult(result: GeminiVeoVideoCallbackDto) {
    const status = {
      [AiLogStatus.Generating]: TaskStatus.InProgress,
      [AiLogStatus.Success]: TaskStatus.Success,
      [AiLogStatus.Failed]: TaskStatus.Failure,
    }[result.status]

    const videoUrl = result.generatedVideos[0]?.url
    return {
      status,
      videoUrl: videoUrl ? FileUtil.buildUrl(videoUrl) : undefined,
      error: result.error ? { message: result.error['message'] as string } : undefined,
    }
  }

  extractInput(request: GeminiVideoAiLog['request']) {
    return {
      prompt: request.prompt || '',
      image: request.image,
      duration: request.duration,
      resolution: request.resolution,
      aspectRatio: request.aspectRatio,
    }
  }

  getOperation(resp: Record<string, any>) {
    const typedResp = new GenerateVideosOperation()
    Object.assign(typedResp, resp)
    return typedResp
  }
}
