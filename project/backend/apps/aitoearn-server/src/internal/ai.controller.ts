import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc, UserType } from '@yikart/common'
import { AiService } from '../ai/ai.service'
import { FireflycardResponseVo, ImageResponseVo, ListVideoTasksResponseVo, VideoGenerationResponseVo, VideoTaskStatusResponseVo } from '../ai/ai.vo'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../ai/core/chat'
import { ModelsConfigDto, ModelsConfigService, ModelsConfigVo } from '../ai/core/models-config'
import { AdminFireflyCardDto, AdminImageGenerationDto, AdminUserListVideoTasksQueryDto, AdminVideoGenerationRequestDto, AdminVideoGenerationStatusSchemaDto } from './dto/ai.dto'

@ApiTags('OpenSource/Internal/Ai')
@Controller('internal')
@Internal()
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
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
    const response = await this.aiService.getImageGenerationModels({
      userId: body.userId,
      userType: body.userType,
    })
    return response
  }

  @ApiDoc({
    summary: 'Generate Image via AI',
    body: AdminImageGenerationDto.schema,
    response: ImageResponseVo,
  })
  @Post('ai/image/generate')
  async generateImage(
    @Body() body: AdminImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageGeneration(body)
    return ImageResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Video via AI',
    body: AdminVideoGenerationRequestDto.schema,
    response: VideoGenerationResponseVo,
  })
  @Post('ai/video/generations')
  async videoGeneration(
    @Body() body: AdminVideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.aiService.userVideoGeneration(body)
    return VideoGenerationResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Get Video Task Status',
    body: AdminVideoGenerationStatusSchemaDto.schema,
    response: VideoTaskStatusResponseVo,
  })
  @Post('ai/video/status')
  async getVideoTaskStatus(@Body() body: AdminVideoGenerationStatusSchemaDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.aiService.getVideoTaskStatus({
      userId: body.userId,
      userType: body.userType,
      taskId: body.taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'List Video Tasks',
    body: AdminUserListVideoTasksQueryDto.schema,
    response: ListVideoTasksResponseVo,
  })
  @Post('ai/video/list')
  async listVideoTasks(@Body() body: AdminUserListVideoTasksQueryDto): Promise<ListVideoTasksResponseVo> {
    const response = await this.aiService.listVideoTasks(body)
    return ListVideoTasksResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Generate Firefly Card Image',
    body: AdminFireflyCardDto.schema,
    response: FireflycardResponseVo,
  })
  @Post('ai/fireflycard')
  async generateFireflycard(
    @Body() body: AdminFireflyCardDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.aiService.generateFireflycard(body)
    return FireflycardResponseVo.create(response)
  }

  @ApiDoc({
    summary: 'Save AI Models Configuration',
    body: ModelsConfigDto.schema,
  })
  @Post('ai/models/config')
  async saveModelsConfig(@Body() config: ModelsConfigDto): Promise<void> {
    await this.modelsConfigService.saveConfig(config)
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
    const response = await this.aiService.getVideoGenerationModels(body)
    return response
  }

  @ApiDoc({
    summary: 'Get Chat Models',
  })
  @Post('ai/models/chat')
  async getChatModels(@Body() body: {
    userId?: string
    userType?: UserType
  }) {
    const response = await this.aiService.getChatModels(body)
    return response
  }
}
