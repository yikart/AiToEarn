import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { AiLogChannel } from '@yikart/mongodb'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../ai/chat'
import { AsyncTaskResponseVo, ImageResponseVo, ImageService, TaskStatusResponseVo } from '../ai/image'
import { ModelsConfigService, ModelsConfigVo } from '../ai/models-config'
import { ListVideoTasksResponseVo, VideoGenerationResponseVo, VideoService, VideoTaskStatusResponseVo } from '../ai/video'
import { UserImageEditDto, UserImageGenerationDto, UserListVideoTasksQueryDto, UserQrCodeArtDto, UserVideoGenerationRequestDto, UserVideoTaskQueryDto } from './ai.dto'

@ApiTags('Internal/Ai')
@Controller('internal')
@Internal()
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
    private readonly modelsConfigService: ModelsConfigService,
  ) { }

  @ApiDoc({
    summary: 'Create Chat Completion',
    body: UserChatCompletionDto.schema,
    response: ChatCompletionVo,
  })
  @Post('ai/chat/completion')
  async chatCompletion(@Body() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Image Generation Models',
  })
  @Post('ai/models/image/generation')
  async getImageGenerationModels(@Body() body: {
    userId: string
    userType: UserType
  }) {
    const response = await this.imageService.generationModelConfig({
      userId: body.userId,
      userType: body.userType,
    })
    return response
  }

  @ApiDoc({
    summary: 'Generate Image via AI',
    body: UserImageGenerationDto.schema,
    response: ImageResponseVo,
  })
  @Post('ai/image/generate')
  async generateImage(
    @Body() body: UserImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.imageService.userGeneration(body)
    return ImageResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate AI Image Asynchronously',
    body: UserImageGenerationDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('ai/image/generate/async')
  async generateImageAsync(
    @Body() body: UserImageGenerationDto,
  ): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userGenerationAsync(body)
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Image Edit Models',
  })
  @Post('ai/models/image/edit')
  async getImageEditModels(@Body() body: {
    userId: string
    userType: UserType
  }) {
    const response = await this.imageService.editModelConfig(body)
    return response
  }

  @ApiDoc({
    summary: 'Edit AI Image Asynchronously',
    body: UserImageEditDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('ai/image/edit/async')
  async editImageAsync(@Body() body: UserImageEditDto): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userEditAsync(body)
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Async Image Task Status',
    response: TaskStatusResponseVo,
  })
  @Post('ai/image/task/status')
  async getImageTaskStatus(
    @Body() body: { logId: string },
  ): Promise<TaskStatusResponseVo> {
    const response = await this.imageService.getTaskStatus(body.logId)
    return TaskStatusResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Video via AI',
    body: UserVideoGenerationRequestDto.schema,
    response: VideoGenerationResponseVo,
  })
  @Post('ai/video/generations')
  async videoGeneration(
    @Body() body: UserVideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.videoService.userVideoGeneration(body)
    return VideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Video Task Status',
    body: UserVideoTaskQueryDto.schema,
    response: VideoTaskStatusResponseVo,
  })
  @Post('ai/video/status')
  async getVideoTaskStatus(@Body() body: UserVideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.videoService.getVideoTaskStatus({
      userId: body.userId,
      userType: body.userType,
      taskId: body.taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'List Video Tasks',
    body: UserListVideoTasksQueryDto.schema,
    response: ListVideoTasksResponseVo,
  })
  @Post('ai/video/list')
  async listVideoTasks(@Body() body: UserListVideoTasksQueryDto): Promise<ListVideoTasksResponseVo> {
    const [list, total] = await this.videoService.listVideoTasks(body)
    return new ListVideoTasksResponseVo(list, total, body)
  }

  @ApiDoc({
    summary: 'Generate QR Code Art Image Asynchronously',
    description: '根据二维码内容、参考样式图和提示词，异步生成美观的二维码艺术图',
    body: UserQrCodeArtDto.schema,
    response: AsyncTaskResponseVo,
  })
  @Post('ai/image/qrcode-art')
  async generateQrCodeArt(
    @Body() body: UserQrCodeArtDto,
  ): Promise<AsyncTaskResponseVo> {
    const response = await this.imageService.userQrCodeArtAsync(body)
    return AsyncTaskResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get AI Models Configuration',
    response: ModelsConfigVo,
  })
  @Post('ai/models/config/get')
  async getModelsConfig(): Promise<ModelsConfigVo> {
    const config = this.modelsConfigService.config
    return ModelsConfigVo.create(config)
  }

  @ApiDoc({
    summary: 'Get Video Generation Models',
  })
  @Post('ai/models/video/generation')
  async getVideoGenerationModels(@Body() body: {
    userId?: string
    userType?: UserType
  }) {
    const response = await this.videoService.getVideoGenerationModelParams(body)
    return response
  }

  @ApiDoc({
    summary: 'Get Chat Models',
  })
  @Post('ai/models/chat')
  async getChatModels(@Body() body: {
    userId?: string
    userType?: UserType
    channel?: AiLogChannel
    scene?: string
  }) {
    const response = await this.chatService.getChatModelConfig(body)
    return response
  }
}
