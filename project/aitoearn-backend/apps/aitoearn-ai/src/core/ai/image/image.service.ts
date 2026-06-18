import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AssetsService } from '@yikart/assets'
import { AppException, getErrorMessage, getExtByMimeType, ImageType, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogImageResult, AiLogRepository, AiLogStatus, AiLogType, AssetType, ImageAiLogResponse, Transactional } from '@yikart/mongodb'
import parseDataUri from 'data-urls'
import OpenAI from 'openai'

import { runWithAiGenerationRetry } from '../ai-generation-retry.util'
import { GeminiService } from '../libs/gemini/gemini.service'
import { OpenaiService } from '../libs/openai'
import { ModelsConfigService } from '../models-config'
import {
  GeminiImageGenerationDto,
  ImageEditDto,
  ImageEditModelsQueryDto,
  ImageGenerationDto,
  ImageGenerationModelsQueryDto,
  UserGeminiImageGenerationDto,
  UserImageEditDto,
  UserImageGenerationDto,
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
    private readonly modelsConfigService: ModelsConfigService,
    private readonly queueService: QueueService,
  ) { }

  private resolveRuntimeImageModel(model: string, kind: 'generation' | 'edit'): string {
    const modelConfig = kind === 'generation'
      ? this.modelsConfigService.config.image.generation.find(item => item.name === model)
      : this.modelsConfigService.config.image.edit.find(item => item.name === model)

    return modelConfig?.runtimeModel ?? model
  }

  private getImageModelRetry(model: string, kind: 'generation' | 'edit'): number {
    const modelConfig = kind === 'generation'
      ? this.modelsConfigService.config.image.generation.find(item => item.name === model)
      : this.modelsConfigService.config.image.edit.find(item => item.name === model)

    return modelConfig?.retry ?? 0
  }

  /**
   * 将 data uri 转换为 Uploadable
   */
  private getUploadableByDataUri(dataUri: string, filename = 'image'): Uploadable {
    const file = parseDataUri(dataUri)
    if (file == null) {
      throw new BadRequestException('Invalid data URI')
    }
    const ext = getExtByMimeType(file.mimeType.essence as ImageType)

    return new File([file.body as Uint8Array<ArrayBuffer>], `${filename}.${ext}`, { type: file.mimeType.essence })
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
    const runtimeModel = this.resolveRuntimeImageModel(params.model, 'generation')

    if (!user) {
      throw new BadRequestException('userId is required')
    }

    if (runtimeModel === 'gpt-image-1') {
      delete params.response_format
      delete params.style
    }

    const result = await this.openaiService.createImageGeneration({
      ...params,
      model: runtimeModel,
    } as Omit<OpenAI.Images.ImageGenerateParams, 'user'> & { apiKey?: string })

    for (const image of result.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, user, `${request.model}`)
      }
      if (image.b64_json) {
        const mimeType = `image/${result.output_format || 'png'}`
        const buffer = Buffer.from(image.b64_json, 'base64')
        const uploadResult = await this.assetsService.uploadFromBuffer(user, buffer, {
          type: AssetType.AiImage,
          mimeType,
        }, `${request.model}`)
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
    const runtimeModel = this.resolveRuntimeImageModel(params.model, 'edit')

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

    if (runtimeModel === 'gpt-image-1') {
      delete params.response_format
    }
    const imageResult = await this.openaiService.createImageEdit({
      ...params,
      model: runtimeModel,
      image: imageFile,
      mask: maskFile,
      size: params.size as 'auto',
    })

    for (const image of imageResult.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, user!, `${request.model}`)
      }
      if (image.b64_json) {
        const mimeType = 'image/png'
        const buffer = Buffer.from(image.b64_json, 'base64')
        const uploadResult = await this.assetsService.uploadFromBuffer(user!, buffer, {
          type: AssetType.AiImage,
          mimeType,
        }, `${request.model}`)
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
      }, `${model}`)
      images.push({ url: uploadResult.asset.path, data: image.imageData.toString('base64'), mimeType: image.mimeType })
    }

    return {
      images,
      usage: result.usage,
    }
  }

  /**
   * 用户 Gemini 图片生成
   */
  async userGeminiGeneration(request: UserGeminiImageGenerationDto) {
    const { userId, userType, model: requestedModel, ...params } = request
    const model = requestedModel || 'gemini-3.1-flash-image-preview'

    const modelConfig = await this.getGeminiImageModelConfig(model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const startedAt = new Date()
    const result = await this.geminiGeneration(userId, { ...params, model })

    const usage = result.usage || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }

    const duration = Date.now() - startedAt.getTime()

    await this.aiLogRepo.create({
      userId,
      userType,
      model,
      channel: AiLogChannel.Gemini,
      type: AiLogType.Image,
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
      },
    }
  }

  /**
   * 获取 Gemini 图片模型配置
   */
  private async getGeminiImageModelConfig(
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
   * 统一的用户请求处理：日志记录和状态更新
   */
  private async handleUserAiAction<T>(opts: {
    userId: string
    userType: UserType
    model: string
    channel?: AiLogChannel
    type: AiLogType
    request: Record<string, unknown>
    retry?: number
    run: () => Promise<T>
  }): Promise<T> {
    const { userId, userType, model, channel, type, request, retry, run } = opts
    const startedAt = new Date()

    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model,
      channel: channel ?? AiLogChannel.NewApi,
      type,
      request,
      status: AiLogStatus.Generating,
      startedAt,
    })

    const result = await runWithAiGenerationRetry(
      run,
      retry,
      (error, attempt, maxAttempts) => {
        this.logger.warn(
          { error, model, attempt, maxAttempts },
          'AI image generation failed, retrying',
        )
      },
    ).catch(async (e) => {
      const duration = Date.now() - startedAt.getTime()
      const errorMessage = getErrorMessage(e)

      await this.aiLogRepo.updateById(log.id, {
        duration,
        status: AiLogStatus.Failed,
        errorMessage,
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

    return await this.handleUserAiAction({
      userId,
      userType,
      model: params.model,
      type: AiLogType.Image,
      request: params,
      retry: this.getImageModelRetry(params.model, 'generation'),
      run: () => this.generation({ ...params, user: userId }),
    })
  }

  /**
   * 用户图片编辑
   */
  async userEdit(request: UserImageEditDto) {
    const { userId, userType, ...params } = request

    return await this.handleUserAiAction({
      userId,
      userType,
      model: params.model,
      type: AiLogType.Image,
      request: params,
      retry: this.getImageModelRetry(params.model, 'edit'),
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

    // 创建 AiLog 记录
    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
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
      retry: this.getImageModelRetry(params.model, 'generation'),
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

    // 创建 AiLog 记录
    const log = await this.aiLogRepo.create({
      userId,
      userType,
      model: params.model,
      channel: AiLogChannel.NewApi,
      type: AiLogType.Image,
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
      retry: this.getImageModelRetry(params.model, 'edit'),
      request: { ...params, user: userId },
      taskType: 'edit',
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
    if (!log || log.type !== AiLogType.Image) {
      throw new NotFoundException('任务不存在')
    }
    const response = log.response as ImageAiLogResponse | undefined

    // 提取图片信息
    let images: AiLogImageResult[] | undefined
    if (response?.list?.length) {
      images = response.list
    }
    else if (response?.images?.length) {
      images = response.images
    }
    else if (response?.image) {
      images = [{ url: response.image }]
    }
    else if (response?.imageUrl) {
      images = [{ url: response.imageUrl }]
    }

    return {
      logId: log.id,
      status: log.status,
      startedAt: log.startedAt,
      duration: log.duration,
      request: log.request,
      response,
      images,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }
  }
}
