import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { UserType } from '@yikart/common'
import { AiService } from './ai.service'
import {
  ChatCompletionVo,
  ChatModelConfigVo,
  DashscopeTaskStatusResponseVo,
  DashscopeVideoGenerationResponseVo,
  FireflycardResponseVo,
  ImageEditModelParamsVo,
  ImageGenerationModelParamsVo,
  ImageResponseVo,
  KlingTaskStatusResponseVo,
  KlingVideoGenerationResponseVo,
  ListVideoTasksResponseVo,
  LogListResponseVo,
  Md2CardResponseVo,
  VideoGenerationModelParamsVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
  VolcengineTaskStatusResponseVo,
  VolcengineVideoGenerationResponseVo,
} from './ai.vo'
import { AsyncTaskResponseVo, TaskStatusResponseVo } from './core/image'
import {
  ChatCompletionDto,
  DashscopeImage2VideoRequestDto,
  DashscopeKeyFrame2VideoRequestDto,
  DashscopeText2VideoRequestDto,
  FireflyCardDto,
  ImageEditDto,
  ImageGenerationDto,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingText2VideoRequestDto,
  LogListQueryDto,
  Md2CardDto,
  UserListVideoTasksQueryDto,
  VideoGenerationRequestDto,
  VolcengineGenerationRequestDto,
} from './dto'

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOperation({ summary: 'AI聊天对话' })
  @Post('chat')
  async chat(@GetToken() token: TokenInfo, @Body() body: ChatCompletionDto): Promise<ChatCompletionVo> {
    const response = await this.aiService.userAiChat({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ChatCompletionVo.create(response)
  }

  @ApiOperation({ summary: '获取用户AI使用日志' })
  @Get('logs')
  async getLogs(
    @GetToken() token: TokenInfo,
    @Query() query: LogListQueryDto,
  ): Promise<LogListResponseVo> {
    const response = await this.aiService.getUserLogs({
      userId: token.id,
      userType: UserType.User,
      ...query,
    })
    return LogListResponseVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片生成' })
  @Post('image/generate')
  async generateImage(
    @GetToken() token: TokenInfo,
    @Body() body: ImageGenerationDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageGeneration({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ImageResponseVo.create(response)
  }

  @ApiOperation({ summary: 'AI图片编辑' })
  @Post('image/edit')
  async editImage(
    @GetToken() token: TokenInfo,
    @Body() body: ImageEditDto,
  ): Promise<ImageResponseVo> {
    const response = await this.aiService.userImageEdit({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return ImageResponseVo.create(response)
  }

  @ApiOperation({ summary: '异步AI图片生成' })
  @Post('image/generate/async')
  async generateImageAsync(
    @GetToken() token: TokenInfo,
    @Body() body: ImageGenerationDto,
  ) {
    const response = await this.aiService.userImageGenerationAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiOperation({ summary: '异步AI图片编辑' })
  @Post('image/edit/async')
  async editImageAsync(
    @GetToken() token: TokenInfo,
    @Body() body: ImageEditDto,
  ) {
    const response = await this.aiService.userImageEditAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiOperation({ summary: '异步Markdown转卡片图片' })
  @Post('md2card/async')
  async generateMd2CardAsync(
    @GetToken() token: TokenInfo,
    @Body() body: Md2CardDto,
  ) {
    const response = await this.aiService.generateMd2CardAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiOperation({ summary: '异步Fireflycard生成卡片图片（免费）' })
  @Post('fireflycard/async')
  async generateFireflycardAsync(
    @GetToken() token: TokenInfo,
    @Body() body: FireflyCardDto,
  ) {
    const response = await this.aiService.generateFireflycardAsync({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return AsyncTaskResponseVo.create(response)
  }

  @ApiOperation({ summary: '查询图片任务状态' })
  @Get('image/task/:logId')
  async getImageTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('logId') logId: string,
  ): Promise<TaskStatusResponseVo> {
    const response = await this.aiService.getImageTaskStatus(logId)
    return TaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: '通用视频生成' })
  @Post('video/generations')
  async videoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VideoGenerationRequestDto,
  ): Promise<VideoGenerationResponseVo> {
    const response = await this.aiService.userVideoGeneration({
      userId: token.id,
      userType: UserType.User,
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
      userType: UserType.User,
      taskId,
    })
    return VideoTaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: '视频任务列表' })
  @Get('video/generations')
  async listVideoTasks(
    @GetToken() token: TokenInfo,
    @Query() query: UserListVideoTasksQueryDto,
  ): Promise<ListVideoTasksResponseVo> {
    const response = await this.aiService.listVideoTasks({
      userId: token.id,
      userType: UserType.User,
      ...query,
    })
    return ListVideoTasksResponseVo.create(response)
  }

  @ApiOperation({ summary: '火山视频生成' })
  @Post('volcengine/video')
  async volcVideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: VolcengineGenerationRequestDto,
  ): Promise<VolcengineVideoGenerationResponseVo> {
    const response = await this.aiService.volcVideoGeneration({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return VolcengineVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '查询火山视频任务状态' })
  @Get('volcengine/video/:taskId')
  async volcVideoTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<VolcengineTaskStatusResponseVo> {
    const response = await this.aiService.volcVideoTaskStatus({
      userId: token.id,
      userType: UserType.User,
      taskId,
    })
    return VolcengineTaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: '可灵文本到视频生成' })
  @Post('kling/text2video')
  async klingVideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingText2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.aiService.klingText2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '可灵图片到视频生成' })
  @Post('kling/image2video')
  async klingImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingImage2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.aiService.klingImage2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '可灵多图片到视频生成' })
  @Post('kling/multi-image2video')
  async klingMultiImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: KlingMultiImage2VideoRequestDto,
  ): Promise<KlingVideoGenerationResponseVo> {
    const response = await this.aiService.klingMultiImage2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return KlingVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '可灵查询任务状态' })
  @Get('kling/:taskId')
  async getKlingTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<KlingTaskStatusResponseVo> {
    const response = await this.aiService.getKlingTaskStatus({
      userId: token.id,
      userType: UserType.User,
      taskId,
    })
    return KlingTaskStatusResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Markdown转卡片图片' })
  @Post('md2card')
  async generateMd2Card(
    @GetToken() token: TokenInfo,
    @Body() body: Md2CardDto,
  ): Promise<Md2CardResponseVo> {
    const response = await this.aiService.generateMd2Card({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return Md2CardResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Fireflycard生成卡片图片（免费）' })
  @Post('fireflycard')
  async generateFireflycard(
    @GetToken() token: TokenInfo,
    @Body() body: FireflyCardDto,
  ): Promise<FireflycardResponseVo> {
    const response = await this.aiService.generateFireflycard({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return FireflycardResponseVo.create(response)
  }

  @ApiOperation({ summary: '获取图片生成模型参数' })
  @Public()
  @Get('models/image/generation')
  async getImageGenerationModels(@GetToken() token?: TokenInfo): Promise<ImageGenerationModelParamsVo[]> {
    const response = await this.aiService.getImageGenerationModels({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, sizes: string[], qualities: string[], styles: string[], pricing: string, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, discount?: string | undefined, originPrice?: string | undefined }) => ImageGenerationModelParamsVo.create(item))
  }

  @ApiOperation({ summary: '获取图片编辑模型参数' })
  @Public()
  @Get('models/image/edit')
  async getImageEditModels(@GetToken() token?: TokenInfo): Promise<ImageEditModelParamsVo[]> {
    const response = await this.aiService.getImageEditModels({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, sizes: string[], pricing: string, maxInputImages: number, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, discount?: string | undefined, originPrice?: string | undefined }) => ImageEditModelParamsVo.create(item))
  }

  @ApiOperation({ summary: '获取视频生成模型参数' })
  @Public()
  @Get('models/video/generation')
  async getVideoGenerationModels(@GetToken() token?: TokenInfo): Promise<VideoGenerationModelParamsVo[]> {
    const response = await this.aiService.getVideoGenerationModels({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, modes: ('text2video' | 'image2video' | 'flf2video' | 'lf2video' | 'multi-image2video')[], channel: any, resolutions: string[], durations: number[], supportedParameters: string[], pricing: { price: number, resolution?: string | undefined, aspectRatio?: string | undefined, mode?: string | undefined, duration?: number | undefined, discount?: string | undefined, originPrice?: number | undefined }[], summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined, defaults?: { resolution?: string | undefined, aspectRatio?: string | undefined, mode?: string | undefined, duration?: number | undefined } | undefined }) => VideoGenerationModelParamsVo.create(item))
  }

  @ApiOperation({ summary: '获取对话模型参数' })
  @Public()
  @Get('models/chat')
  async getChatModels(@GetToken() token?: TokenInfo): Promise<ChatModelConfigVo[]> {
    const response = await this.aiService.getChatModels({
      userId: token?.id,
      userType: UserType.User,
    })
    return response.map((item: { name: string, description: string, inputModalities: ('image' | 'text' | 'video' | 'audio')[], outputModalities: ('image' | 'text' | 'video' | 'audio')[], pricing: { prompt: string, completion: string, discount?: string | undefined, originPrompt?: string | undefined, originCompletion?: string | undefined, image?: string | undefined, originImage?: string | undefined, audio?: string | undefined, originAudio?: string | undefined } | { price: string, discount?: string | undefined, originPrice?: string | undefined }, summary?: string | undefined, logo?: string | undefined, tags?: string[] | undefined, mainTag?: string | undefined }) => ChatModelConfigVo.create(item))
  }

  @ApiOperation({ summary: 'Dashscope文本到视频生成' })
  @Post('dashscope/text2video')
  async dashscopeText2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeText2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.aiService.dashscopeText2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Dashscope图片到视频生成' })
  @Post('dashscope/image2video')
  async dashscopeImage2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeImage2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.aiService.dashscopeImage2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: 'Dashscope首尾帧到视频生成' })
  @Post('dashscope/keyframe2video')
  async dashscopeKeyFrame2VideoGeneration(
    @GetToken() token: TokenInfo,
    @Body() body: DashscopeKeyFrame2VideoRequestDto,
  ): Promise<DashscopeVideoGenerationResponseVo> {
    const response = await this.aiService.dashscopeKeyFrame2Video({
      userId: token.id,
      userType: UserType.User,
      ...body,
    })
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  @ApiOperation({ summary: '查询Dashscope任务状态' })
  @Get('dashscope/:taskId')
  async getDashscopeTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ): Promise<DashscopeTaskStatusResponseVo> {
    const response = await this.aiService.getDashscopeTaskStatus({
      userId: token.id,
      userType: UserType.User,
      taskId,
    })
    return DashscopeTaskStatusResponseVo.create(response)
  }
}
