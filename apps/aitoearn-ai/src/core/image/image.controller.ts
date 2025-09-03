import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { FireflycardGenerationDto, ImageEditDto, ImageGenerationDto, Md2CardGenerationDto, UserImageEditDto, UserImageGenerationDto } from './image.dto'
import { ImageService } from './image.service'
import { FireflycardResponseVo, ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageResponseVo, Md2CardResponseVo } from './image.vo'

@Controller()
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
  ) {}

  @NatsMessagePattern('ai.image.generations')
  async imageGeneration(@Payload() data: ImageGenerationDto): Promise<ImageResponseVo> {
    const response = await this.imageService.generation(data)
    return ImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.image.edits')
  async imageEdit(@Payload() data: ImageEditDto): Promise<ImageResponseVo> {
    const response = await this.imageService.edit(data)
    return ImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.image.generation.models')
  async getImageGenerationModels(): Promise<ImageGenerationModelParamsVo[]> {
    const response = await this.imageService.generationModelConfig()
    return response.map(item => ImageGenerationModelParamsVo.create(item))
  }

  @NatsMessagePattern('ai.image.edit.models')
  async getImageEditModels(): Promise<ImageEditModelParamsVo[]> {
    const response = await this.imageService.editModelConfig()
    return response.map(item => ImageEditModelParamsVo.create(item))
  }

  @NatsMessagePattern('ai.md2card.generate')
  async md2Card(@Payload() data: Md2CardGenerationDto): Promise<Md2CardResponseVo> {
    const response = await this.imageService.md2Card(data)
    return Md2CardResponseVo.create(response)
  }

  @NatsMessagePattern('ai.firefly-card.generate')
  async fireflyCard(@Payload() data: FireflycardGenerationDto): Promise<FireflycardResponseVo> {
    const response = await this.imageService.fireflyCard(data)
    return FireflycardResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.image.generations')
  async userImageGeneration(@Payload() data: UserImageGenerationDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userImageGeneration(data)
    return ImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.image.edits')
  async userImageEdit(@Payload() data: UserImageEditDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userImageEdit(data)
    return ImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.user.md2card.generate')
  async userMd2Card(@Payload() data: UserImageEditDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userImageEdit(data)
    return ImageResponseVo.create(response)
  }
}
