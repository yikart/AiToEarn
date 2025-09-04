import path from 'node:path'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { S3Service } from '@yikart/aws-s3'
import { AppException, getExtByMimeType, ImageType, ResponseCode, UserType } from '@yikart/common'
import { AiLogRepository, AiLogStatus, AiLogType } from '@yikart/mongodb'
import parseDataUri from 'data-urls'
import OpenAI from 'openai'
import { config } from '../../config'
import { FireflycardService } from '../../libs/fireflycard'
import { Md2cardService } from '../../libs/md2card'
import { OpenaiService } from '../../libs/openai'
import {
  FireflyCardDto,
  ImageEditDto,
  ImageGenerationDto,
  Md2CardDto,
  UserFireflyCardDto,
  UserImageEditDto,
  UserImageGenerationDto,
  UserMd2CardDto,
} from './image.dto'

type Uploadable = File | Response

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name)

  constructor(
    private readonly fireflyCardService: FireflycardService,
    private readonly s3Service: S3Service,
    private readonly openaiService: OpenaiService,
    private readonly md2cardService: Md2cardService,
    private readonly userClient: AitoearnUserClient,
    private readonly aiLogRepo: AiLogRepository,
  ) {}

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
  private async uploadImageToS3(imageUrlOrResponse: string | Response, basePath: string, user?: string): Promise<string> {
    if (typeof imageUrlOrResponse === 'string') {
      const filename = `${Date.now().toString(36)}-${path.basename(imageUrlOrResponse.split('?')[0])}`
      const fullPath = path.join(basePath, user || '', filename)
      const result = await this.s3Service.putObjectFromUrl(imageUrlOrResponse, fullPath)
      return result.path
    }
    else {
      const contentType = imageUrlOrResponse.headers.get('content-type')!
      const ext = getExtByMimeType(contentType as ImageType)
      const filename = `${Date.now().toString(36)}.${ext}`
      const fullPath = path.join(basePath, user || '', filename)
      const result = await this.s3Service.putObject(fullPath, imageUrlOrResponse.body!)
      return result.path
    }
  }

  /**
   * 图片生成
   */
  async generation(request: ImageGenerationDto) {
    const { user, ...imageParams } = request
    const imageResult = await this.openaiService.createImageGeneration({
      ...imageParams,
    } as Omit<OpenAI.Images.ImageGenerateParams, 'user'> & { apiKey?: string })

    for (const image of imageResult.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, `ai/images/${request.model}`, user)
      }
    }

    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * 图片编辑
   */
  async edit(request: ImageEditDto) {
    const { image, mask, user, ...editParams } = request
    const imageFile = await this.getUploadableByUrlOrDataUri(image, 'image')
    const maskFile = mask ? await this.getUploadableByUrlOrDataUri(mask, 'mask') : undefined

    const imageResult = await this.openaiService.createImageEdit({
      ...editParams,
      image: imageFile,
      mask: maskFile,
      size: editParams.size as 'auto',
    })

    for (const image of imageResult.data || []) {
      if (image.url) {
        image.url = await this.uploadImageToS3(image.url, `ai/images/${request.model}`, user)
      }
    }

    return {
      created: imageResult.created,
      list: imageResult.data || [],
      usage: imageResult.usage,
    }
  }

  /**
   * MD2Card生成
   */
  async md2Card(request: Md2CardDto) {
    const result = await this.md2cardService.generateCard(request)

    for (const image of result.images) {
      image.url = await this.uploadImageToS3(image.url, 'ai/images/md2card')
    }

    return result
  }

  /**
   * Fireflycard生成
   */
  async fireflyCard(request: FireflyCardDto) {
    const reponse = await this.fireflyCardService.createImage(request)

    const imagePath = await this.uploadImageToS3(reponse, 'ai/images/md2card')
    return {
      image: imagePath,
    }
  }

  /**
   * 扣减用户积分
   */
  private async deductUserPoints(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.userClient.deductPoints({
      userId,
      amount,
      type: 'ai_service',
      description,
      metadata,
    })
  }

  /**
   * 获取图片模型价格
   */
  private getImageModelPricing(model: string, kind: 'generation' | 'edit'): number {
    const list = kind === 'generation' ? config.ai.models.image.generation : config.ai.models.image.edit
    const modelConfig = list.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
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
    type: AiLogType
    pricing: number
    request: Record<string, unknown>
    run: () => Promise<T>
  }): Promise<T> {
    const { userId, userType, model, type, pricing, request, run } = opts

    if (pricing > 0 && userType === UserType.User) {
      const { balance } = await this.userClient.getPointsBalance({ userId })
      if (balance < pricing) {
        throw new AppException(ResponseCode.UserPointsInsufficient)
      }
    }

    const startedAt = new Date()
    const result = await run()
    const duration = Date.now() - startedAt.getTime()

    if (pricing > 0 && userType === UserType.User) {
      await this.deductUserPoints(userId, pricing, model)
    }

    await this.aiLogRepo.create({
      userId,
      userType,
      model,
      type,
      points: pricing,
      startedAt,
      duration,
      request,
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

    const pricing = this.getImageModelPricing(params.model, 'generation')

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

    const pricing = this.getImageModelPricing(params.model, 'edit')

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

  async userMd2Card(request: UserMd2CardDto) {
    const { userId, userType, ...params } = request
    const pricing = 2

    return await this.handleUserAiAction({
      userId,
      userType,
      model: 'md2card',
      type: AiLogType.Card,
      pricing,
      request: params,
      run: () => this.md2Card(params),
    })
  }

  async userFireFlyCard(request: UserFireflyCardDto) {
    const { userId, userType, ...params } = request

    return await this.handleUserAiAction({
      userId,
      userType,
      model: 'fireflyCard',
      type: AiLogType.Card,
      pricing: 0,
      request: params,
      run: () => this.fireflyCard(params),
    })
  }

  /**
   * 获取图片生成模型参数
   */
  async generationModelConfig() {
    return config.ai.models.image.generation
  }

  /**
   * 获取图片编辑模型参数
   */
  async editModelConfig() {
    return config.ai.models.image.edit
  }
}
