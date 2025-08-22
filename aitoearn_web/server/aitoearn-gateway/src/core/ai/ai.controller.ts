import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { AiService } from './ai.service'
import {
  ChatModelVo,
  FireflycardResponseVo,
  ImageEditModelVo,
  ImageGenerationModelVo,
  Md2CardResponseVo,
  MjTaskFetchResponseVo,
  MjVideoSubmitResponseVo,
  UserAiChatResponseVo,
  UserImageResponseVo,
  UserLogsResponseVo,
  VideoGenerationModelVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
} from './ai.vo'
import {
  FireflycardRequestDto,
  Md2CardRequestDto,
  UserAiChatRequestDto,
  UserImageEditRequestDto,
  UserImageGenerationRequestDto,
  UserImageVariationRequestDto,
  UserLogsQueryRequestDto,
  UserVideoGenerationDto,
  UserVideoGenerationRequestDto,
} from './dto'

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({ summary: 'AI聊天对话' })
  @Post('chat')
  async chat(@GetToken() token: TokenInfo, @Body() body: UserAiChatRequestDto): Promise<UserAiChatResponseVo> {
    const response = await this.aiService.userAiChat({
      userId: token.id,
      messages: body.messages,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    })
    return UserAiChatResponseVo.create(response)
  }

  @ApiOperation({ summary: '获取用户AI使用日志' })
  @Get('logs')
  async getLogs(
    @GetToken() token: TokenInfo,
    @Query() query: UserLogsQueryRequestDto,
  ): Promise<UserLogsResponseVo> {
    const response = await this.aiService.getUserLogs({
      userId: token.id,
      page: query.page,
      size: query.size,
      start_timestamp: query.start_timestamp,
      end_timestamp: query.end_timestamp,
      model_name: query.model_name,
    })
    return UserLogsResponseVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片生成' })
  @Post('image/generate')
  async generateImage(
    @GetToken() token: TokenInfo,
    @Body() body: UserImageGenerationRequestDto,
  ): Promise<UserImageResponseVo> {
    const response = await this.aiService.userImageGeneration({
      userId: token.id,
      prompt: body.prompt,
      model: body.model,
      n: body.n,
      quality: body.quality,
      response_format: body.response_format,
      size: body.size,
      style: body.style,
      user: body.user,
    })
    return UserImageResponseVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片编辑' })
  @Post('image/edit')
  async editImage(
    @GetToken() token: TokenInfo,
    @Body() body: UserImageEditRequestDto,
  ): Promise<UserImageResponseVo> {
    const response = await this.aiService.userImageEdit({
      userId: token.id,
      image: body.image,
      prompt: body.prompt,
      mask: body.mask,
      model: body.model,
      n: body.n,
      size: body.size,
      response_format: body.response_format,
      user: body.user,
    })
    return UserImageResponseVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片变体' })
  @Post('image/variation')
  async variationImage(
    @GetToken() token: TokenInfo,
    @Body() body: UserImageVariationRequestDto,
  ): Promise<UserImageResponseVo> {
    const response = await this.aiService.userImageVariation({
      userId: token.id,
      image: body.image,
      model: body.model,
      n: body.n,
      size: body.size,
      response_format: body.response_format,
      user: body.user,
    })
    return UserImageResponseVo.create(response)
  }

  @ApiOperation({ summary: 'MJ视频生成' })
  @Post('mj/submit/video')
  async mjSubmitVideo(
    @GetToken() token: TokenInfo,
    @Body() body: UserVideoGenerationRequestDto,
  ): Promise<MjVideoSubmitResponseVo> {
    const response = await this.aiService.userMjSubmitVideo({
      userId: token.id,
      ...body,
    })
    return MjVideoSubmitResponseVo.create(response)
  }

  @ApiOperation({ summary: 'MJ任务查询' })
  @Get('mj/task/:taskId/fetch')
  async mjFetchTask(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<MjTaskFetchResponseVo> {
    const response = await this.aiService.userMjTaskFetch({
      userId: token.id,
      taskId,
    })
    return MjTaskFetchResponseVo.create(response)
  }

  @ApiOperation({ summary: '通用视频生成' })
  @Post('video/generations')
  async videoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: UserVideoGenerationDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.aiService.userVideoGeneration({
      userId: token.id,
      ...body,
    })
    return VideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '查询视频任务状态' })
  @Get('video/generations/:taskId')
  async getVideoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VideoTaskStatusResponseVo> {
    const response = await this.aiService.getVideoTaskStatus({
      userId: token.id,
      taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Markdown转卡片图片' })
  @Post('md2card')
  async generateMd2Card(
    @GetToken() token: TokenInfo,
    @Body() body: Md2CardRequestDto,
  ): Promise<Md2CardResponseVo> {
    const response = await this.aiService.generateMd2Card({
      userId: token.id,
      markdown: body.markdown,
      theme: body.theme,
      themeMode: body.themeMode,
      width: body.width,
      height: body.height,
      splitMode: body.splitMode,
      mdxMode: body.mdxMode,
      overHiddenMode: body.overHiddenMode,
    })
    return Md2CardResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Fireflycard生成卡片图片（免费）' })
  @Post('fireflycard')
  async generateFireflycard(
    @GetToken() token: TokenInfo,
    @Body() body: FireflycardRequestDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.aiService.generateFireflycard({
      userId: token.id,
      content: body.content,
      temp: body.temp,
      title: body.title,
      style: body.style,
      switchConfig: body.switchConfig,
    })
    return FireflycardResponseVo.create(response)
  }

  @ApiOperation({ summary: '获取图片生成模型参数' })
  @Public()
  @Get('models/image/generation')
  async getImageGenerationModels(): Promise<ImageGenerationModelVo[]> {
    const response = await this.aiService.getImageGenerationModels()
    return response.map(item => ImageGenerationModelVo.create(item))
  }

  @ApiOperation({ summary: '获取图片编辑模型参数' })
  @Public()
  @Get('models/image/edit')
  async getImageEditModels(): Promise<ImageEditModelVo[]> {
    const response = await this.aiService.getImageEditModels()
    return response.map(item => ImageEditModelVo.create(item))
  }

  @ApiOperation({ summary: '获取视频生成模型参数' })
  @Public()
  @Get('models/video/generation')
  async getVideoGenerationModels(): Promise<VideoGenerationModelVo[]> {
    const response = await this.aiService.getVideoGenerationModels()
    return response.map(item => VideoGenerationModelVo.create(item))
  }

  @ApiOperation({ summary: '获取对话模型参数' })
  @Public()
  @Get('models/chat')
  async getChatModels(): Promise<ChatModelVo[]> {
    const response = await this.aiService.getChatModels()
    return response.map(item => ChatModelVo.create(item))
  }
}
