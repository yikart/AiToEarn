import path from 'node:path'
import { FireflycardService } from '@libs/fireflycard'
import { Md2cardService } from '@libs/md2card'
import { OpenaiService } from '@libs/openai'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { AitoearnUserClient } from '@yikart/aitoearn-user-client'
import { S3Service } from '@yikart/aws-s3'
import { AppException, getExtByMimeType, ImageType, ResponseCode } from '@yikart/common'
import parseDataUri from 'data-urls'
import OpenAI from 'openai'
import { Uploadable } from 'openai/src/internal/uploads'
import { config } from '../../config'
import {
  FireflycardGenerationDto,
  ImageEditDto,
  ImageGenerationDto,
  Md2CardGenerationDto,
  UserImageEditDto,
  UserImageGenerationDto,
} from './image.dto'

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name)

  constructor(
    private readonly fireflyCardService: FireflycardService,
    private readonly s3Service: S3Service,
    private readonly openaiService: OpenaiService,
    private readonly md2cardService: Md2cardService,
    private readonly userClient: AitoearnUserClient,
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
  async md2Card(request: Md2CardGenerationDto) {
    const result = await this.md2cardService.generateCard(request)

    for (const image of result.images) {
      image.url = await this.uploadImageToS3(image.url, 'ai/images/md2card')
    }

    return result
  }

  /**
   * Fireflycard生成
   */
  async fireflyCard(request: FireflycardGenerationDto) {
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
   * 用户图片生成
   */
  async userImageGeneration(request: UserImageGenerationDto) {
    const { userId, ...imageParams } = request

    const modelConfig = config.ai.models.image.generation.find(m => m.name === imageParams.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const pricing = Number(modelConfig.pricing)

    // 检查用户积分余额
    const { balance } = await this.userClient.getPointsBalance({ userId })
    if (balance < pricing) {
      throw new AppException(ResponseCode.UserPointsInsufficient)
    }

    // 使用已有的图片生成方法
    const imageResult = await this.generation(imageParams)

    await this.deductUserPoints(
      userId,
      pricing,
      imageParams.model,
    )

    return imageResult
  }

  /**
   * 用户图片编辑
   */
  async userImageEdit(request: UserImageEditDto) {
    const { userId, ...editParams } = request

    const modelConfig = config.ai.models.image.edit.find(m => m.name === editParams.model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }
    const pricing = Number(modelConfig.pricing)

    const { balance } = await this.userClient.getPointsBalance({ userId })
    if (balance < pricing) {
      throw new AppException(ResponseCode.UserPointsInsufficient)
    }

    const imageResult = await this.edit(editParams)

    await this.deductUserPoints(
      userId,
      pricing,
      editParams.model,
    )

    return imageResult
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
