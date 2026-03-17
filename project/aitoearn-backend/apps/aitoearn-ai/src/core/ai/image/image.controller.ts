import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { ImageEditDto, ImageGenerationDto } from './image.dto'
import { ImageService } from './image.service'
import { AsyncTaskResponseVo, ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageResponseVo, TaskStatusResponseVo } from './image.vo'

@ApiTags('Me/Ai/Image')
@Controller('ai')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}
  @ApiDoc({
    summary: 'Get Image Generation Model Parameters',
    response: [ImageGenerationModelParamsVo],
  })
  @Public()
  @Get('/models/image/generation')
  async getImageGenerationModels(@GetToken() token?: TokenInfo): Promise<ImageGenerationModelParamsVo[]> {
    const response = await this.imageService.generationModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map(item => ImageGenerationModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Get Image Editing Model Parameters',
    response: [ImageEditModelParamsVo],
  })
  @Public()
  @Get('/models/image/edit')
  async getImageEditModels(@GetToken() token?: TokenInfo): Promise<ImageEditModelParamsVo[]> {
    const response = await this.imageService.editModelConfig({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map(item => ImageEditModelParamsVo.create(item))
  }

  @ApiDoc({
    summary: 'Generate AI Image',
    body: ImageGenerationDto.schema,
    response: ImageResponseVo,
  })
  @Post('/image/generate')
  async generateImage(
    @GetToken() token: TokenInfo,
    @Body() body: ImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.imageService.userGeneration({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ImageResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Edit AI Image',
    body: ImageEditDto.schema,
    response: ImageResponseVo,
  })
  @Post('/image/edit')
  async editImage(
    @GetToken() token: TokenInfo,
    @Body() body: ImageEditDto,
  ): Promise<ImageResponseVo> {
    const response = await this.imageService.userEdit({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ImageResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate AI Image Asynchronously',
    body: ImageGenerationDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('/image/generate/async')
  async generateImageAsync(
    @GetToken() token: TokenInfo,
    @Body() body: ImageGenerationDto,
  ) {
    const response = await this.imageService.userGenerationAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Edit AI Image Asynchronously',
    body: ImageEditDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('/image/edit/async')
  async editImageAsync(
    @GetToken() token: TokenInfo,
    @Body() body: ImageEditDto,
  ) {
    const response = await this.imageService.userEditAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Image Task Status',
    response: TaskStatusResponseVo,
  })
  @Get('/image/task/:logId')
  async getImageTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('logId') logId: string,
  ): Promise<TaskStatusResponseVo> {
    const response = await this.imageService.getTaskStatus(logId)
    return TaskStatusResponseVo.create(response)
  }
}
