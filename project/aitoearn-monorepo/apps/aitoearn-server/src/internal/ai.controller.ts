import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { UserType } from '@yikart/common'
import { AiService } from '../ai/ai.service'
import { FireflycardResponseVo, ImageResponseVo, ListVideoTasksResponseVo, VideoGenerationResponseVo, VideoTaskStatusResponseVo } from '../ai/ai.vo'
import { ChatCompletionVo, ChatService, UserChatCompletionDto } from '../ai/core/chat'
import { AdminFireflyCardDto, AdminImageGenerationDto, AdminUserListVideoTasksQueryDto, AdminVideoGenerationRequestDto, AdminVideoGenerationStatusSchemaDto } from './dto/ai.dto'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) { }

  @ApiOperation({ summary: 'create publish record' })
  @Post('ai/chat/completion')
  async chatCompletion(@Body() data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.chatService.userChatCompletion(data)
    return ChatCompletionVo.create(response)
  }

  @ApiOperation({ summary: '获取图片生成模型参数' })
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

  @ApiOperation({ summary: 'AI图片生成' })
  @Post('ai/image/generate')
  async generateImage(
    @Body() body: AdminImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageGeneration(body)
    return ImageResponseVo.create(response)
  }

  @ApiOperation({ summary: '通用视频生成' })
  @Post('ai/video/generations')
  async videoGeneration(
    @Body() body: AdminVideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.aiService.userVideoGeneration(body)
    return VideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '查询视频任务状态' })
  @Post('ai/video/status')
  async getVideoTaskStatus(@Body() body: AdminVideoGenerationStatusSchemaDto): Promise<VideoTaskStatusResponseVo> {
    const response = await this.aiService.getVideoTaskStatus({
      userId: body.userId,
      userType: body.userType,
      taskId: body.taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: '视频任务列表' })
  @Post('ai/video/list')
  async listVideoTasks(@Body() body: AdminUserListVideoTasksQueryDto): Promise<ListVideoTasksResponseVo> {
    const response = await this.aiService.listVideoTasks(body)
    return ListVideoTasksResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Fireflycard生成卡片图片' })
  @Post('ai/fireflycard')
  async generateFireflycard(
    @Body() body: AdminFireflyCardDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.aiService.generateFireflycard(body)
    return FireflycardResponseVo.create(response)
  }
}
