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
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, FileUtil, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { TaskStatus } from '../../../../common'
import { GeminiService } from '../../libs/gemini'
import { ModelsConfigService } from '../../models-config'
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
  ) { }

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
    const { userId, userType, model, prompt, seed, duration, negativePrompt, resolution } = request

    const pricing = await this.calculatePrice({
      userId,
      userType,
      model,
      duration,
    })

    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

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

    const result = await this.geminiLibService.createVideo(params)
    if (!result.operation.name || result.operation.error) {
      this.logger.error(result, 'Gemini Veo createVideo failed')
      throw new AppException(ResponseCode.AiCallFailed, result.operation.error)
    }

    if (userType === UserType.User) {
      await this.creditsHelper.deductCredits({
        userId,
        amount: pricing,
        type: CreditsType.AiService,
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
      request: {
        ...request,
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

    if (aiLog.status !== AiLogStatus.Generating) {
      return aiLog.response as GeminiVeoVideoCallbackDto
    }

    this.logger.debug(operation, `Gemini Veo callback`)

    let aiLogStatus: AiLogStatus
    const generatedVideos: { url: string, gcsUrl: string | null }[] = []

    // 从 request 读取 keyPairId
    const requestData = aiLog.request as UserGeminiVeoVideoCreateRequestDto & { keyPairId?: string }
    const keyPairId = requestData.keyPairId || this.geminiLibService.keyManager.getDefaultKeyPairId()

    if (!requestData.keyPairId) {
      this.logger.warn(
        { aiLogId: aiLog.id, taskId: aiLog.taskId },
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

        const uploadResult = await this.assetsService.uploadFromBuffer(aiLog.userId, buffer, {
          type: AssetType.AiVideo,
          mimeType: video.mimeType || 'video/mp4',
        }, `${aiLog.model}`)

        generatedVideos.push({
          url: uploadResult.asset.path,
          gcsUrl,
        })
      }
    }
    else {
      aiLogStatus = AiLogStatus.Generating
    }

    const duration = Date.now() - aiLog.startedAt.getTime()
    const completedAt = aiLogStatus !== AiLogStatus.Generating ? new Date() : null

    const request = aiLog.request as UserGeminiVeoVideoCreateRequestDto
    const callbackData: GeminiVeoVideoCallbackDto = {
      completedAt,
      status: aiLogStatus,
      generatedVideos,
      name: operation.name!,
      model: request.model,
      prompt: request.prompt,
      createdAt: aiLog.startedAt,
      error: operation.error,
    }

    await this.aiLogRepo.updateById(aiLog.id, {
      status: aiLogStatus,
      response: callbackData,
      duration,
      errorMessage: operation.error?.['message'],
    })

    if (aiLogStatus === AiLogStatus.Failed) {
    }

    if (aiLogStatus === AiLogStatus.Success || aiLogStatus === AiLogStatus.Failed) {
    }

    return callbackData
  }

  async getVideo(userId: string, userType: UserType, logId: string): Promise<GeminiVeoVideoCallbackDto> {
    const aiLog = await this.aiLogRepo.getByIdAndUserId(logId, userId, userType)

    if (aiLog == null || !aiLog.taskId || aiLog.type !== AiLogType.Video || aiLog.channel !== AiLogChannel.Gemini) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    if (aiLog.status === AiLogStatus.Generating) {
      const operation = await this.geminiLibService.getOperation(this.getOperation({ name: aiLog.taskId }))
      return this.callback(operation)
    }

    return aiLog.response as GeminiVeoVideoCallbackDto
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

  extractInput(request: Record<string, unknown>) {
    return {
      prompt: (request['prompt'] as string) || '',
      image: request['image'] as string | undefined,
      duration: request['duration'] as number | undefined,
      resolution: request['resolution'] as string | undefined,
      aspectRatio: request['aspectRatio'] as string | undefined,
    }
  }

  getOperation(resp: Record<string, any>) {
    const typedResp = new GenerateVideosOperation()
    Object.assign(typedResp, resp)
    return typedResp
  }
}
