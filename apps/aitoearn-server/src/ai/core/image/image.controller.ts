import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import {
  ImageEditModelsQueryDto,
  ImageGenerationModelsQueryDto,
  UserFireflyCardDto,
  UserImageEditDto,
  UserImageGenerationDto,
  UserMd2CardDto,
} from './image.dto'
import { ImageService } from './image.service'
import { AsyncTaskResponseVo, FireflycardResponseVo, ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageResponseVo, Md2CardResponseVo, TaskStatusResponseVo } from './image.vo'

@Controller()
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
  ) {}

  // @NatsMessagePattern('ai.image.generations')
  @Post('ai/image/generations')
  async imageGeneration(@Body() data: UserImageGenerationDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userGeneration(data)
    return ImageResponseVo.create(response)
  }

  // @NatsMessagePattern('ai.image.edits')
  @Post('ai/image/edits')
  async imageEdit(@Body() data: UserImageEditDto): Promise<ImageResponseVo> {
    const response = await this.imageService.userEdit(data)
    return ImageResponseVo.create(response)
  }

  // @NatsMessagePattern('ai.image.generation.models')
  @Post('ai/image/generation/models')
  async getImageGenerationModels(@Body() data: ImageGenerationModelsQueryDto): Promise<ImageGenerationModelParamsVo[]> {
    const response = await this.imageService.generationModelConfig(data)
    return response.map(item => ImageGenerationModelParamsVo.create(item))
  }

  // @NatsMessagePattern('ai.image.edit.models')
  @Post('ai/image/edit/models')
  async getImageEditModels(@Body() data: ImageEditModelsQueryDto): Promise<ImageEditModelParamsVo[]> {
    const response = await this.imageService.editModelConfig(data)
    return response.map(item => ImageEditModelParamsVo.create(item))
  }

  // @NatsMessagePattern('ai.md2card.generate')
  @Post('ai/md2card/generate')
  async md2Card(@Body() data: UserMd2CardDto): Promise<Md2CardResponseVo> {
    const response = await this.imageService.userMd2Card(data)
    return Md2CardResponseVo.create(response)
  }

  // @NatsMessagePattern('ai.firefly-card.generate')
  @Post('ai/firefly-card/generate')
  async fireflyCard(@Body() data: UserFireflyCardDto): Promise<FireflycardResponseVo> {
    const response = await this.imageService.userFireFlyCard(data)
    return FireflycardResponseVo.create(response)
  }

  // 异步图片生成
  @Post('ai/image/generations/async')
  async imageGenerationAsync(@Body() data: UserImageGenerationDto): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userGenerationAsync(data)
    return AsyncTaskResponseVo.create(response)
  }

  // 异步图片编辑
  @Post('ai/image/edits/async')
  async imageEditAsync(@Body() data: UserImageEditDto): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userEditAsync(data)
    return AsyncTaskResponseVo.create(response)
  }

  // 异步 MD2Card 生成
  @Post('ai/md2card/generate/async')
  async md2CardAsync(@Body() data: UserMd2CardDto): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userMd2CardAsync(data)
    return AsyncTaskResponseVo.create(response)
  }

  // 异步 FireflyCard 生成
  @Post('ai/firefly-card/generate/async')
  async fireflyCardAsync(@Body() data: UserFireflyCardDto): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userFireFlyCardAsync(data)
    return AsyncTaskResponseVo.create(response)
  }

  // 查询任务状态
  @Get('ai/image/task/:logId')
  async getTaskStatus(@Param('logId') logId: string): Promise<TaskStatusResponseVo> {
    const response = await this.imageService.getTaskStatus(logId)
    return TaskStatusResponseVo.create(response)
  }
}
