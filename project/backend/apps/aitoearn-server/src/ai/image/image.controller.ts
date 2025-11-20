import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { FireflyCardDto, ImageEditDto, ImageGenerationDto, Md2CardDto } from './image.dto'
import { ImageService } from './image.service'
import { AsyncTaskResponseVo, FireflycardResponseVo, ImageEditModelParamsVo, ImageGenerationModelParamsVo, ImageResponseVo, Md2CardResponseVo, TaskStatusResponseVo } from './image.vo'

@ApiTags('OpenSource/Me/Ai')
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

  @ApiDoc({
    summary: 'Convert Markdown to Card Image',
    body: Md2CardDto.schema,
    response: Md2CardResponseVo,
  })
  @Post('/md2card')
  async generateMd2Card(
    @GetToken() token: TokenInfo,
    @Body() body: Md2CardDto,
  ): Promise<Md2CardResponseVo> {
    const response = await this.imageService.userMd2Card({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return Md2CardResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Convert Markdown to Card Image Asynchronously',
    body: Md2CardDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('/md2card/async')
  async generateMd2CardAsync(
    @GetToken() token: TokenInfo,
    @Body() body: Md2CardDto,
  ) {
    const response = await this.imageService.userMd2CardAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Firefly Card Image (Free)',
    body: FireflyCardDto.schema,
    response: FireflycardResponseVo,
  })
  @Post('/fireflycard')
  async generateFireflycard(
    @GetToken() token: TokenInfo,
    @Body() body: FireflyCardDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.imageService.userFireFlyCard({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return FireflycardResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Firefly Card Image Asynchronously (Free)',
    body: FireflyCardDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('/fireflycard/async')
  async generateFireflycardAsync(
    @GetToken() token: TokenInfo,
    @Body() body: FireflyCardDto,
  ) {
    const response = await this.imageService.userFireFlyCardAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }
}
