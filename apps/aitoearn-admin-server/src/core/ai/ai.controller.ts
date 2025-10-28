import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserType } from '@yikart/common'
import { GetToken, Public } from '../../common/auth/auth.guard'
import { TokenInfo } from '../../common/auth/interfaces/auth.interfaces'
import { AiService } from './ai.service'
import {
  ChatModelConfigVo,
  FireflycardResponseVo,
  ImageResponseVo,
  ListVideoTasksResponseVo,
  VideoGenerationModelParamsVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
} from './ai.vo'
import {
  AiModelsConfigDto,
  FireflyCardDto,
  ImageGenerationDto,
  UserListVideoTasksQueryDto,
  VideoGenerationRequestDto,
} from './dto'

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  // 1
  @ApiOperation({ summary: 'AI图片生成' })
  @Post('image/generate')
  async generateImage(
    @GetToken() token: TokenInfo,
    @Body() body: ImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageGeneration({
      userId: token.id,
      userType: UserType.Admin,
      ...body,
    })
    return ImageResponseVo.create(response)
  }

  @ApiOperation({ summary: '通用视频生成' })
  @Post('video/generations')
  async videoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.aiService.userVideoGeneration({
      ...body,
      userId: token.id,
      userType: UserType.User,
    })
    return VideoGenerationResponseVo.create(response)
  }

  // 1
  @ApiOperation({ summary: '查询视频任务状态' })
  @Get('video/generations/:taskId')
  async getVideoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VideoTaskStatusResponseVo> {
    const response = await this.aiService.getVideoTaskStatus({
      userId: token.id,
      userType: UserType.Admin,
      taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  // 1
  @ApiOperation({ summary: '视频任务列表' })
  @Get('video/generations')
  async listVideoTasks(
    @GetToken() token: TokenInfo,
    @Query() query: UserListVideoTasksQueryDto,
  ): Promise<ListVideoTasksResponseVo> {
    const response = await this.aiService.listVideoTasks({
      ...query,
      userId: token.id,
      userType: UserType.Admin,
    })
    return ListVideoTasksResponseVo.create(response)
  }

  // 1
  @ApiOperation({ summary: 'Fireflycard生成卡片图片（免费）' })
  @Post('fireflycard')
  async generateFireflycard(
    @GetToken() token: TokenInfo,
    @Body() body: FireflyCardDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.aiService.generateFireflycard({
      userId: token.id,
      userType: UserType.Admin,
      ...body,
    })
    return FireflycardResponseVo.create(response)
  }

  // 1
  @ApiOperation({ summary: '获取视频生成模型参数' })
  @Get('models/video/generation')
  async getVideoGenerationModels(
    @GetToken() token?: TokenInfo,
  ): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.aiService.getVideoGenerationModels({
      userId: token?.id,
      userType: UserType.Admin,
    })
    return response.map((item: any) => VideoGenerationModelParamsVo.create(item))
  }

  // 1
  @ApiOperation({ summary: '获取对话模型参数' })
  @Public()
  @Get('models/chat')
  async getChatModels(
    @GetToken() token?: TokenInfo,
  ): Promise<ChatModelConfigVo[]> {
    const response = await this.aiService.getChatModels({
      userId: token?.id,
      userType: UserType.Admin,
    })
    return response.map((item: any) => ChatModelConfigVo.create(item))
  }

  // 1
  @ApiOperation({ summary: '获取 ai 模型配置' })
  @Public()
  @Get('config')
  async getModelsConfig() {
    const response = await this.aiService.getModelsConfig()
    return response
  }

  // 1
  @ApiOperation({ summary: '更新 ai 模型配置' })
  @Put('config')
  async saveModelsConfig(@Body() body: AiModelsConfigDto) {
    await this.aiService.saveModelsConfig(body)
  }
}
