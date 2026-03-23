import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService } from '@yikart/assets'
import { AppException, CreditsType, getExtByMimeType, ImageType, ResponseCode, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, AssetType, Transactional, UserRepository } from '@yikart/mongodb'
import parseDataUri from 'data-urls'
import OpenAI from 'openai'
import QRCode from 'qrcode'
import sharp from 'sharp'

import { GeminiService } from '../libs/gemini/gemini.service'
import { OpenaiService } from '../libs/openai'
import { ModelsConfigService } from '../models-config'
import { calculatePricingPoints, ChatPricing } from '../pricing/pricing-calculator'
import {
  GeminiImageGenerationDto,
  ImageEditDto,
  ImageEditModelsQueryDto,
  ImageGenerationDto,
  ImageGenerationModelsQueryDto,
  QrCodeArtDto,
  UserGeminiImageGenerationDto,
  UserImageEditDto,
  UserImageGenerationDto,
  UserQrCodeArtDto,
} from './image.dto'

type Uploadable = File | Response

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name)

  constructor(
    private readonly assetsService: AssetsService,
    private readonly openaiService: OpenaiService,
    private readonly geminiService: GeminiService,
    private readonly aiLogRepo: AiLogRepository,
    private readonly creditsHelper: CreditsHelperService,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly queueService: QueueService,
    private readonly userRepo: UserRepository,
  ) { }

  /**
   * 将 data uri 转换为 Uploadable
   */
  private getUploadableByDataUri(dataUri: string, filename = 'image'): Uploadable {
    const file = parseDataUri(dataUri)
    if (file == null) {
      throw new BadRequestException('Invalid data URI')
    }
    const ext = getExtByMimeType(file.mimeType.essence as ImageType)

    return new File([file.body], `${filename}.${ext}`, { type: file.mimeType.essence })
  }

  /**
   * 将 URL 转换为 Uploadable
   */
  private async getUploadableByUrl(url: string): Promise<Uploadable> {
    return await fetch(url)
  }

  /**
   * 将 URL 或 Data URI 转换为 Uploadable
   */
  private async getUploadableByUrlOrDataUri(urlOrDataUri: string, filename = 'image'): Promise<Uploadable> {
    if (/^https?:\/\//.test(urlOrDataUri)) {
      return await this.getUploadableByUrl(urlOrDataUri)
    }
    return this.getUploadableByDataUri(urlOrDataUri, filename)
  }

  /**
   * 上传图片到S3并返回路径
   */
  private async uploadImageToS3(imageUrlOrResponse: string | Response, userId: string, subPath?: string): Promise<string> {
    if (typeof imageUrlOrResponse === 'string') {
      const result = await this.assetsService.uploadFromUrl(userId, {
        url: imageUrlOrResponse,
        type: AssetType.AiImage,
      }, subPath)
      return result.asset.path
    }
    else {
      const contentType = imageUrlOrResponse.headers.get('content-type') || 'image/png'
      const buffer = Buffer.from(await imageUrlOrResponse.arrayBuffer())
      const result = await this.assetsService.uploadFromBuffer(userId, buffer, {
        type: AssetType.AiImage,
        mimeType: contentType,
      }, subPath)
      return result.asset.path
    }
  }

  /**
   * 图片生成
   */
  async generation(request: ImageGenerationDto) {
    const { user, ...params } = request

    if (!user) {
      throw new BadRequestException('userId is required')
    }

    if (params.model === 'gpt-image-1') {
      delete params.response_format
      delete params.style
    }

    const result = await this.openaiService.createImageGeneration({
      ...params,
    } as Omit<OpenAI.Images.ImageGenerateParams, 'user'> & { apiKey?: string })

    for (const image of result.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, user, `ai/images/${request.model}`)
      }
      if (image.b64_json) {
        const mimeType = `image/${result.output_format || 'png'}`
        const buffer = Buffer.from(image.b64_json, 'base64')
        const uploadResult = await this.assetsService.uploadFromBuffer(user, buffer, {
          type: AssetType.AiImage,
          mimeType,
        }, `ai/images/${request.model}`)
        image.url = uploadResult.asset.path
        delete image.b64_json
      }
    }

    return {
      ...result,
      list: result.data || [],
    }
  }

  /**
   * 图片编辑
   */
  async edit(request: ImageEditDto) {
    const { image, mask, user, ...params } = request

    let imageFile: Uploadable | Uploadable[]
    if (Array.isArray(image)) {
      imageFile = await Promise.all(image.map((img, index) =>
        this.getUploadableByUrlOrDataUri(img, `image-${index}`),
      ))
    }
    else {
      imageFile = await this.getUploadableByUrlOrDataUri(image, 'image')
    }

    const maskFile = mask ? await this.getUploadableByUrlOrDataUri(mask, 'mask') : undefined

    if (params.model === 'gpt-image-1') {
      delete params.response_format
    }
    const imageResult = await this.openaiService.createImageEdit({
      ...params,
      image: imageFile,
      mask: maskFile,
      size: params.size as 'auto',
    })

    for (const image of imageResult.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, user!, `ai/images/${request.model}`)
      }
      if (image.b64_json) {
        const mimeType = 'image/png'
        const buffer = Buffer.from(image.b64_json, 'base64')
        const uploadResult = await this.assetsService.uploadFromBuffer(user!, buffer, {
          type: AssetType.AiImage,
          mimeType,
        }, `ai/images/${request.model}`)
        image.url = uploadResult.asset.path
        delete image.b64_json
      }
    }

    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * Gemini 图片生成
   */
  async geminiGeneration(userId: string, request: GeminiImageGenerationDto & { model: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' }) {
    const { model } = request
    const result = await this.geminiService.generateImage({
      prompt: request.prompt,
      imageUrls: request.imageUrls,
      imageSize: request.imageSize,
      aspectRatio: request.aspectRatio,
      model,
    })

    const images: { url: string, data: string, mimeType: string }[] = []
    for (const image of result.images) {
      const uploadResult = await this.assetsService.uploadFromBuffer(userId, image.imageData, {
        type: AssetType.AiImage,
        mimeType: image.mimeType,
      }, `ai/images/${model}`)
      images.push({ url: uploadResult.asset.path, data: image.imageData.toString('base64'), mimeType: image.mimeType })
    }

    return {
      images,
      usage: result.usage,
    }
  }

  /**
   * 用户 Gemini 图片生成（基于 token 计费）
   */
  async userGeminiGeneration(request: UserGeminiImageGenerationDto) {
    const { userId, userType, model: requestedModel, ...params } = request
    const model = requestedModel || 'gemini-3.1-flash-image-preview'

    const modelConfig = await this.getGeminiImageModelConfig(userId, userType, model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    // 检查余额
    if (userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < 0) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await this.geminiGeneration(userId, { ...params, model })

    const usage = result.usage || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
    const pricing = modelConfig.pricing as ChatPricing
    const points = calculatePricingPoints(pricing, {
      input_tokens: usage.promptTokenCount,
      output_tokens: usage.candidatesTokenCount,
      input_token_details: usage.inputTokenDetails,
      output_token_details: usage.outputTokenDetails,
    })

    this.logger.debug({ points, usage, pricing }, 'Gemini image generation pricing')

    if (points > 0 && userType === UserType.User) {
      await this.deductUserCredits(userId, points, model, usage as unknown as Record<string, unknown>)
    }

    const duration = Date.now() - startedAt.getTime()

    await this.aiLogRepo.create({
      userId,
      userType,
      model,
      channel: AiLogChannel.Gemini,
      type: AiLogType.Image,
      points,
      request: params,
      response: { ...result, data: void 0 },
      status: AiLogStatus.Success,
      startedAt,
      duration,
    })

    return {
      ...result,
      usage: {
        input_tokens: usage.promptTokenCount,
        output_tokens: usage.candidatesTokenCount,
        total_tokens: usage.totalTokenCount,
        input_token_details: usage.inputTokenDetails,
        output_token_details: usage.outputTokenDetails,
        points,
      },
    }
  }

  /**
   * 获取 Gemini 图片模型配置
   */
  private async getGeminiImageModelConfig(
    userId: string,
    userType: UserType,
    model: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview',
  ) {
    const chatModels = this.modelsConfigService.config.chat
    const modelConfig = chatModels.find(m => m.name === model)
    if (!modelConfig) {
      return null
    }

    return modelConfig
  }

  /**
   * 扣减用户Credits
   */
  private async deductUserCredits(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.creditsHelper.deductCredits({
      userId,
      amount,
      type: CreditsType.AiService,
      description,
      metadata,
    })
  }

  /**
   * 恢复用户Credits
   */
  async addUserCredits(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.creditsHelper.addCredits({
      userId,
      amount,
      type: CreditsType.AiService,
      description,
      metadata,
      expiredAt: null, // 退款Credits永久有效
    })
  }

  /**
   * 获取图片模型价格
   */
  private async getImageModelPricing(model: string, kind: 'generation' | 'edit', userId?: string, userType?: UserType): Promise<number> {
    const list = kind === 'generation' ? await this.generationModelConfig({ userId, userType }) : await this.editModelConfig({ userId, userType })
    const modelConfig = list.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel, 'model not found')
    }
    return Number(modelConfig.pricing)
  }

  /**
   * 统一的用户请求处理：校验余额、计费、扣费、日志
   */
  private async handleUserAiAction<T>(opts: {
    userId: string
    userType: UserType
    model: string
    channel?: AiLogChannel
    type: AiLogType
    pricing: number
    request: Record<string, unknown>
    run: () => Promise<T>
  }): Promise<T> {
    const { userId, userType, model, channel, type, pricing, request, run } = opts
    const startedAt = new Date()

    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model,
      channel: channel ?? AiLogChannel.NewApi,
      type,
      points: pricing,
      request,
      status: AiLogStatus.Generating,
      startedAt,
    })

    if (pricing > 0 && userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
      await this.deductUserCredits(userId, pricing, model)
    }

    const result = await run().catch(async (e) => {
      if (pricing > 0 && userType === UserType.User) {
        await this.addUserCredits(userId, pricing, model)
      }
      const duration = Date.now() - startedAt.getTime()

      await this.aiLogRepo.updateById(log.id, {
        duration,
        status: AiLogStatus.Failed,
        errorMessage: e.message,
      })
      throw e
    })
    const duration = Date.now() - startedAt.getTime()

    await this.aiLogRepo.updateById(log.id, {
      duration,
      status: AiLogStatus.Success,
      response: result as Record<string, unknown>,
    })

    return result
  }

  /**
   * 用户图片生成
   */
  async userGeneration(request: UserImageGenerationDto) {
    const { userId, userType, ...params } = request

    const pricing = await this.getImageModelPricing(params.model, 'generation', userId, userType)

    return await this.handleUserAiAction({
      userId,
      userType,
      model: params.model,
      type: AiLogType.Image,
      pricing,
      request: params,
      run: () => this.generation({ ...params, user: userId }),
    })
  }

  /**
   * 用户图片编辑
   */
  async userEdit(request: UserImageEditDto) {
    const { userId, userType, ...params } = request

    const pricing = await this.getImageModelPricing(params.model, 'edit', userId, userType)

    return await this.handleUserAiAction({
      userId,
      userType,
      model: params.model,
      type: AiLogType.Image,
      pricing,
      request: params,
      run: () => this.edit({ ...params, user: userId }),
    })
  }

  /**
   * 获取图片生成模型参数
   * @param data 查询参数，包含可选的 userId 和 userType，可用于后续个性化模型推荐
   */
  async generationModelConfig(_data: ImageGenerationModelsQueryDto) {
    return this.modelsConfigService.config.image.generation
  }

  /**
   * 获取图片编辑模型参数
   * @param data 查询参数，包含可选的 userId 和 userType，可用于后续个性化模型推荐
   */
  async editModelConfig(_data: ImageEditModelsQueryDto) {
    return this.modelsConfigService.config.image.edit
  }

  /**
   * 异步图片生成
   */
  @Transactional()
  async userGenerationAsync(request: UserImageGenerationDto) {
    const { userId, userType, ...params } = request
    const pricing = await this.getImageModelPricing(params.model, 'generation', userId, userType)

    if (pricing > 0 && userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
      await this.deductUserCredits(userId, pricing, params.model)
    }

    // 创建 AiLog 记录
    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      points: pricing,
      request: params,
      status: AiLogStatus.Generating,
      startedAt: new Date(),
    })

    // 添加队列任务
    await this.queueService.addAiImageAsyncJob({
      logId: log.id,
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      pricing,
      request: { ...params, user: userId },
      taskType: 'generation',
    })

    return {
      logId: log.id,
      status: AiLogStatus.Generating,
    }
  }

  /**
   * 异步图片编辑
   */
  @Transactional()
  async userEditAsync(request: UserImageEditDto) {
    const { userId, userType, ...params } = request
    const pricing = await this.getImageModelPricing(params.model, 'edit', userId, userType)

    if (pricing > 0 && userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
      await this.deductUserCredits(userId, pricing, params.model)
    }

    // 创建 AiLog 记录
    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      points: pricing,
      request: params,
      status: AiLogStatus.Generating,
      startedAt: new Date(),
    })

    // 添加队列任务
    await this.queueService.addAiImageAsyncJob({
      logId: log.id,
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      pricing,
      request: { ...params, user: userId },
      taskType: 'edit',
    })

    return {
      logId: log.id,
      status: AiLogStatus.Generating,
    }
  }

  /**
   * 生成二维码艺术图
   * 流程：AI 生成艺术背景 → Gemini 分析最佳叠加位置 → sharp 叠加二维码
   */
  async qrCodeArt(userId: string, request: QrCodeArtDto) {
    // 1. 生成二维码 buffer
    const qrCodeBuffer = await QRCode.toBuffer(request.content, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'H',
    })

    // 2. 用 AI 生成艺术背景（不包含二维码）
    let bgResult: Awaited<ReturnType<typeof this.openaiService.createImageEdit>>

    const qrPlacementHint = '要求：图片右下角区域（约占图片面积15%-20%）必须保持简洁、颜色浅淡或留白，用于放置二维码。主要内容和视觉焦点应集中在图片的左侧和上方区域。'

    if (request.referenceImageUrl) {
      const referenceImage = await this.getUploadableByUrl(request.referenceImageUrl)
      const bgPrompt = `基于参考图的艺术风格，生成一张美观的艺术背景图。${qrPlacementHint}${request.prompt}`

      bgResult = await this.openaiService.createImageEdit({
        model: request.model,
        image: referenceImage,
        prompt: bgPrompt,
        size: (request.size as 'auto') || 'auto',
      })
    }
    else {
      const bgPrompt = `生成一张美观的艺术背景图。${qrPlacementHint}${request.prompt}`

      bgResult = await this.openaiService.createImageGeneration({
        model: request.model,
        prompt: bgPrompt,
        size: (request.size as 'auto') || 'auto',
      })
    }

    const bgImage = bgResult.data?.[0]
    if (!bgImage) {
      throw new AppException(ResponseCode.AiCallFailed)
    }

    let bgBuffer: Buffer
    if (bgImage.b64_json) {
      bgBuffer = Buffer.from(bgImage.b64_json, 'base64')
    }
    else {
      const bgResponse = await fetch(bgImage.url!)
      bgBuffer = Buffer.from(await bgResponse.arrayBuffer())
    }

    // 3. 计算右下角固定位置
    const bgMetadata = await sharp(bgBuffer).metadata()
    const bgWidth = bgMetadata.width!
    const bgHeight = bgMetadata.height!

    const margin = Math.round(Math.min(bgWidth, bgHeight) * 0.04)
    const qrSize = Math.round(Math.min(bgWidth, bgHeight) * 0.18)

    const resizedQrCode = await sharp(qrCodeBuffer)
      .resize(qrSize, qrSize, { fit: 'contain' })
      .toBuffer()

    // 4. 用 sharp 叠加二维码到右下角
    const composited = await sharp(bgBuffer)
      .composite([{
        input: resizedQrCode,
        left: bgWidth - qrSize - margin,
        top: bgHeight - qrSize - margin,
      }])
      .png()
      .toBuffer()

    // 5. 上传结果
    const uploadResult = await this.assetsService.uploadFromBuffer(userId, composited, {
      type: AssetType.AiImage,
      mimeType: 'image/png',
    }, `ai/images/qrcode-art/${request.model}`)

    return { imageUrl: uploadResult.asset.path }
  }

  /**
   * 用户二维码艺术图生成（同步）
   */
  async userQrCodeArt(request: UserQrCodeArtDto) {
    const { userId, userType, ...params } = request

    const pricing = await this.getImageModelPricing(params.model, 'edit', userId, userType)

    return await this.handleUserAiAction({
      userId,
      userType,
      model: params.model,
      type: AiLogType.Image,
      pricing,
      request: params,
      run: () => this.qrCodeArt(userId, params),
    })
  }

  /**
   * 异步二维码艺术图生成
   */
  @Transactional()
  async userQrCodeArtAsync(request: UserQrCodeArtDto) {
    const { userId, userType, ...params } = request
    const pricing = await this.getImageModelPricing(params.model, 'edit', userId, userType)

    if (pricing > 0 && userType === UserType.User) {
      const balance = await this.creditsHelper.getBalance(userId)
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserCreditsInsufficient)
      }
      await this.deductUserCredits(userId, pricing, params.model)
    }

    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      points: pricing,
      request: params,
      status: AiLogStatus.Generating,
      startedAt: new Date(),
    })

    await this.queueService.addAiImageAsyncJob({
      logId: log.id,
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
      pricing,
      request: params,
      taskType: 'qrCodeArt',
    })

    return {
      logId: log.id,
      status: AiLogStatus.Generating,
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(logId: string) {
    const log = await this.aiLogRepo.getById(logId)
    if (!log) {
      throw new NotFoundException('任务不存在')
    }

    // 提取图片信息
    let images: Array<{ url?: string, b64_json?: string, revised_prompt?: string }> | undefined
    if (log.response) {
      // 处理不同的响应格式
      if (log.response['list'] && Array.isArray(log.response['list'])) {
        // 图片生成和编辑的响应格式
        images = log.response['list'] as Array<{ url?: string, b64_json?: string, revised_prompt?: string }>
      }
      else if (log.response['images'] && Array.isArray(log.response['images'])) {
        // MD2Card 的响应格式
        images = log.response['images'] as Array<{ url?: string, b64_json?: string, revised_prompt?: string }>
      }
      else if (log.response['image']) {
        // FireflyCard 的响应格式
        images = [{ url: log.response['image'] as string }]
      }
      else if (log.response['imageUrl']) {
        // QrCodeArt 的响应格式
        images = [{ url: log.response['imageUrl'] as string }]
      }
    }

    return {
      logId: log.id,
      status: log.status,
      startedAt: log.startedAt,
      duration: log.duration,
      points: log.points,
      request: log.request,
      response: log.response,
      images,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }
  }
}
