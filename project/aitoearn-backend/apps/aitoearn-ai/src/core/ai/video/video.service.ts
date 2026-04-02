import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { StorageProvider } from '@yikart/assets'
import { AppException, ResponseCode, UserType } from '@yikart/common'
import { AiLog, AiLogChannel, AiLogRepository, AiLogStatus, AiLogType, UserRepository } from '@yikart/mongodb'
import { TaskStatus } from '../../../common'
import {
  Content,
  ContentType,
  GetVideoGenerationTaskResponse,
  ImageRole,
  parseModelTextCommand,
  serializeModelTextCommand,
} from '../libs/volcengine'
import { ModelsConfigService } from '../models-config'
import { GeminiVeoVideoCallbackDto, GeminiVideoService } from './gemini'
import { GrokVideoCallbackDto, GrokVideoService } from './grok'
import { OpenAIVideoCallbackDto, OpenAIVideoService } from './openai'
import {
  UserListVideoTasksQueryDto,
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VideoGenerationModelsQueryDto,
} from './video.dto'
import { VideoTaskInput } from './video.vo'
import { VolcengineVideoService } from './volcengine'

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)

  constructor(
    private readonly userRepo: UserRepository,
    private readonly aiLogRepo: AiLogRepository,
    private readonly modelsConfigService: ModelsConfigService,
    private readonly storageProvider: StorageProvider,
    private readonly volcengineVideoService: VolcengineVideoService,
    private readonly openaiVideoService: OpenAIVideoService,
    private readonly grokVideoService: GrokVideoService,
    private readonly geminiVideoService: GeminiVideoService,
  ) {}

  /**
   * 将图片 URL 转为 R2 预签名 URL，绕过 CDN robots.txt 限制
   */
  private async toPresignedUrl(url: string | undefined): Promise<string | undefined> {
    if (!url) {
      return undefined
    }
    return this.storageProvider.toPresignedUrl(url)
  }

  private async toPresignedUrls(urls: string[]): Promise<string[]> {
    return Promise.all(urls.map(url => this.storageProvider.toPresignedUrl(url)))
  }

  async calculateVideoGenerationPrice(params: {
    model: string
    userId?: string
    userType?: UserType
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }): Promise<number> {
    const { model, userId, userType } = params

    const modelConfig = (await this.getVideoGenerationModelParams({ userId, userType })).find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const { resolution, aspectRatio, mode, duration } = {
      ...modelConfig.defaults,
      ...params,
    }

    const pricingConfig = modelConfig.pricing.find((pricing) => {
      const resolutionMatch = !pricing.resolution || !resolution || pricing.resolution === resolution
      const aspectRatioMatch = !pricing.aspectRatio || !aspectRatio || pricing.aspectRatio === aspectRatio
      const modeMatch = !pricing.mode || !mode || pricing.mode === mode
      const durationMatch = !pricing.duration || !duration || pricing.duration === duration

      return resolutionMatch && aspectRatioMatch && modeMatch && durationMatch
    })

    if (!pricingConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    this.logger.debug({
      params,
      modelConfig,
      pricingConfig,
    }, '模型价格计算')

    return pricingConfig.price
  }

  /**
   * 用户视频生成（通用接口）
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const { model } = request

    const modelConfig = this.modelsConfigService.config.video.generation.find(m => m.name === model)
    if (!modelConfig) {
      throw new AppException(ResponseCode.InvalidModel)
    }

    const channel = modelConfig.channel

    const createTaskResponse = (taskId: string, points: number) => ({
      id: taskId,
      status: TaskStatus.Submitted,
      points,
    })

    switch (channel) {
      case AiLogChannel.Volcengine:
        return this.handleVolcengineGeneration(request, createTaskResponse)
      case AiLogChannel.OpenAI:
        return this.handleOpenAIGeneration(request, createTaskResponse)
      case AiLogChannel.Grok:
        return this.handleGrokGeneration(request, createTaskResponse)
      default:
        throw new AppException(ResponseCode.InvalidModel)
    }
  }

  /**
   * 处理Volcengine渠道的视频生成
   */
  private async handleVolcengineGeneration<T>(
    request: UserVideoGenerationRequestDto,
    createTaskResponse: (taskId: string, points: number) => T,
  ) {
    const { userId, userType, model, prompt, duration, size, image, image_tail } = request

    if (Array.isArray(image)) {
      throw new BadRequestException()
    }

    const textCommand = parseModelTextCommand(prompt)
    const content: Content[] = []

    if (image) {
      content.push({
        type: ContentType.ImageUrl,
        image_url: { url: await this.toPresignedUrl(image) || image },
        role: ImageRole.FirstFrame,
      })
    }

    if (image_tail) {
      content.push({
        type: ContentType.ImageUrl,
        image_url: { url: await this.toPresignedUrl(image_tail) || image_tail },
        role: ImageRole.LastFrame,
      })
    }

    content.push({
      type: ContentType.Text,
      text: `${textCommand.prompt} ${serializeModelTextCommand({
        ...textCommand.params,
        duration,
        resolution: size,
      })}`,
    })

    const result = await this.volcengineVideoService.create({
      userId,
      userType,
      model,
      content,
    })
    return createTaskResponse(result.id, result.points)
  }

  /**
   * 处理OpenAI渠道的视频生成
   */
  private async handleOpenAIGeneration<T>(
    request: UserVideoGenerationRequestDto,
    createTaskResponse: (taskId: string, points: number) => T,
  ) {
    const { userId, userType, model, prompt, image } = request

    if (Array.isArray(image)) {
      throw new BadRequestException('OpenAI does not support multiple images')
    }

    const result = await this.openaiVideoService.createVideo({
      userId,
      userType,
      prompt,
      input_reference: await this.toPresignedUrl(image),
      model: model as 'sora-2' | 'sora-2-pro',
      seconds: request.duration ? request.duration.toString() as '10' | '15' | '25' : undefined,
      size: request.size as '720x1280' | '1280x720' | '1024x1792' | '1792x1024' | undefined,
    })
    return createTaskResponse(result.id, result.points)
  }

  /**
   * 处理Grok渠道的视频生成
   */
  private async handleGrokGeneration<T>(
    request: UserVideoGenerationRequestDto,
    createTaskResponse: (taskId: string, points: number) => T,
  ) {
    const { userId, userType, model, prompt, video_url } = request

    if (video_url) {
      const parsed = this.storageProvider.parsePathFromUrl(video_url)
      const videoUrl = parsed.startsWith('http') ? video_url : await this.storageProvider.toPresignedUrl(video_url)
      const result = await this.grokVideoService.createVideo({
        userId,
        userType,
        model,
        prompt,
        videoUrl,
      })
      return createTaskResponse(result.id, result.points)
    }

    const imageUrl = Array.isArray(request.image) ? request.image[0] : request.image
    const result = await this.grokVideoService.createVideo({
      userId,
      userType,
      model,
      prompt,
      duration: request.duration,
      aspectRatio: request.metadata?.['aspectRatio'] as string,
      resolution: request.metadata?.['resolution'] as string,
      imageUrl: imageUrl ? await this.toPresignedUrl(imageUrl) : undefined,
    })
    return createTaskResponse(result.id, result.points)
  }

  private extractInput(aiLog: AiLog): VideoTaskInput {
    const request = (aiLog.request || {}) as Record<string, unknown>

    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
        return this.volcengineVideoService.extractInput(request)
      case AiLogChannel.OpenAI:
        return this.openaiVideoService.extractInput(request)
      case AiLogChannel.Grok:
        return this.grokVideoService.extractInput(request)
      case AiLogChannel.Gemini:
        return this.geminiVideoService.extractInput(request)
      default:
        return { prompt: '' }
    }
  }

  async transformToCommonResponse(aiLog: AiLog) {
    const input = this.extractInput(aiLog)

    const base = {
      id: aiLog.id,
      model: aiLog.model,
      input,
      submittedAt: aiLog.startedAt,
      startedAt: aiLog.startedAt,
    }

    if (aiLog.status === AiLogStatus.Generating) {
      return {
        ...base,
        status: TaskStatus.InProgress,
        videoUrl: undefined as string | undefined,
        error: undefined as { message: string } | undefined,
        finishedAt: undefined as Date | undefined,
      }
    }

    if (!aiLog.response) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }

    const finishedAt = aiLog.duration
      ? new Date(aiLog.startedAt.getTime() + aiLog.duration)
      : undefined

    const channelResult = this.getChannelTaskResult(aiLog)

    return {
      ...base,
      ...channelResult,
      finishedAt,
    }
  }

  private getChannelTaskResult(aiLog: AiLog) {
    switch (aiLog.channel) {
      case AiLogChannel.Volcengine:
        return this.volcengineVideoService.getTaskResult(aiLog.response as unknown as GetVideoGenerationTaskResponse)
      case AiLogChannel.OpenAI:
        return this.openaiVideoService.getTaskResult(aiLog.response as unknown as OpenAIVideoCallbackDto)
      case AiLogChannel.Grok:
        return this.grokVideoService.getTaskResult(aiLog.response as unknown as GrokVideoCallbackDto)
      case AiLogChannel.Gemini:
        return this.geminiVideoService.getTaskResult(aiLog.response as unknown as GeminiVeoVideoCallbackDto)
      default:
        throw new AppException(ResponseCode.InvalidAiTaskId)
    }
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const { taskId } = request

    const aiLog = await this.aiLogRepo.getById(taskId)

    if (aiLog == null || aiLog.type !== AiLogType.Video) {
      throw new AppException(ResponseCode.InvalidAiTaskId)
    }
    return this.transformToCommonResponse(aiLog)
  }

  async listVideoTasks(request: UserListVideoTasksQueryDto) {
    const [aiLogs, count] = await this.aiLogRepo.listWithPagination({
      ...request,
      type: AiLogType.Video,
    })

    return [await Promise.all(aiLogs.map(log => this.transformToCommonResponse(log))), count] as const
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModelParams(_data: VideoGenerationModelsQueryDto) {
    return this.modelsConfigService.config.video.generation
  }
}
