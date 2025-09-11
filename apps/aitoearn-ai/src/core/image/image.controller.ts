import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  UserFireflyCardDto,
  UserImageEditDto,
  UserImageGenerationDto,
  UserMd2CardDto,
} from './image.dto'
import { ImageService } from './image.service'
import { FireflycardResponseVo, ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageResponseVo, Md2CardResponseVo } from './image.vo'

@Controller()
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
  ) {}

  @NatsMessagePattern('ai.image.generations')
  async imageGeneration(@Payload() data: UserImageGenerationDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userGeneration(data)
    return ImageResponseVo.create(response)
  }

  @NatsMessagePattern('ai.image.edits')
  async imageEdit(@Payload() data: UserImageEditDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userEdit(data)
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
  async md2Card(@Payload() data: UserMd2CardDto): Promise<Md2CardResponseVo> {
    const response = await this.imageService.userMd2Card(data)
    return Md2CardResponseVo.create(response)
  }

  @NatsMessagePattern('ai.firefly-card.generate')
  async fireflyCard(@Payload() data: UserFireflyCardDto): Promise<FireflycardResponseVo> {
    const response = await this.imageService.userFireFlyCard(data)
    return FireflycardResponseVo.create(response)
  }
}
