import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import OpenAI from 'openai'
import { LogListResponseVo } from './ai.vo'
import { ChatMessageDto, ChatModelConfigVo, ChatModelsQueryDto, ChatService, UserChatCompletionDto } from './core/chat'
import { FireflycardResponseVo, ImageEditModelParamsVo, ImageEditModelsQueryDto, ImageGenerationModelParamsVo, ImageGenerationModelsQueryDto, ImageResponseVo, ImageService, Md2CardResponseVo, TaskStatusResponseVo, UserFireflyCardDto, UserImageEditDto, UserImageGenerationDto, UserMd2CardDto } from './core/image'
import { LogListQueryDto, LogsService } from './core/logs'
import { DashscopeImage2VideoRequestDto, DashscopeKeyFrame2VideoRequestDto, DashscopeTaskQueryDto, DashscopeTaskStatusResponseVo, DashscopeText2VideoRequestDto, DashscopeVideoGenerationResponseVo, KlingImage2VideoRequestDto, KlingMultiImage2VideoRequestDto, KlingTaskQueryDto, KlingTaskStatusResponseVo, KlingText2VideoRequestDto, KlingVideoGenerationResponseVo, ListVideoTasksResponseVo, UserListVideoTasksQueryDto, UserVideoGenerationRequestDto, UserVideoTaskQueryDto, VideoGenerationModelParamsVo, VideoGenerationModelsQueryDto, VideoGenerationResponseVo, VideoService, VideoTaskStatusResponseVo, VolcengineGenerationRequestDto, VolcengineTaskQueryDto, VolcengineTaskStatusResponseVo, VolcengineVideoGenerationResponseVo } from './core/video'

@Injectable()
export class AiService {
  constructor(
    private readonly chatService: ChatService,
    private readonly logsService: LogsService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
  ) { }

  /**
   * User AI chat
   * @param request Chat request parameters
   * @returns AI chat response
   */
  async userAiChat(request: UserChatCompletionDto) {
    const response = await this.chatService.userChatCompletion(request)
    return response
  }

  /**
   * Get user AI usage logs
   * @param request Log query request parameters
   * @returns User log response
   */
  async getUserLogs(request: LogListQueryDto) {
    const [list, total] = await this.logsService.getLogList(request)
    return new LogListResponseVo(list, total, request)
  }

  /**
   * User image generation
   * @param request Image generation request parameters
   * @returns Image generation response
   */
  async userImageGeneration(request: UserImageGenerationDto) {
    const response = await this.imageService.userGeneration(request)
    return ImageResponseVo.create(response)
  }

  /**
   * User image editing
   * @param request Image editing request parameters
   * @returns Image editing response
   */
  async userImageEdit(request: UserImageEditDto) {
    const response = await this.imageService.userEdit(request)
    return ImageResponseVo.create(response)
  }

  /**
   * Async user image generation
   * @param request Image generation request parameters
   * @returns Async task response
   */
  async userImageGenerationAsync(request: UserImageGenerationDto) {
    const response = await this.imageService.userGenerationAsync(request)
    return response
  }

  /**
   * Async user image editing
   * @param request Image editing request parameters
   * @returns Async task response
   */
  async userImageEditAsync(request: UserImageEditDto) {
    const response = await this.imageService.userEditAsync(request)
    return response
  }

  /**
   * Async Markdown to card image
   * @param request MD2Card request parameters
   * @returns Async task response
   */
  async generateMd2CardAsync(request: UserMd2CardDto) {
    const response = await this.imageService.userMd2CardAsync(request)
    return response
  }

  /**
   * Async Fireflycard card image generation
   * @param request Fireflycard request parameters
   * @returns Async task response
   */
  async generateFireflycardAsync(request: UserFireflyCardDto) {
    const response = await this.imageService.userFireFlyCardAsync(request)
    return response
  }

  /**
   * Query image task status
   * @param logId Task log ID
   * @returns Task status response
   */
  async getImageTaskStatus(logId: string) {
    const response = await this.imageService.getTaskStatus(logId)
    return TaskStatusResponseVo.create(response)
  }

  /**
   * General video generation
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const response = await this.videoService.userVideoGeneration(request)
    return VideoGenerationResponseVo.create(response)
  }

  /**
   * Query video task status
   * @param request Video task query request parameters
   * @returns Video task status response
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const response = await this.videoService.getVideoTaskStatus(request)
    return VideoTaskStatusResponseVo.create(response)
  }

  /**
   * Query video task status
   * @param request Video task query request parameters
   * @returns Video task status response
   */
  async listVideoTasks(request: UserListVideoTasksQueryDto) {
    const [list, total] = await this.videoService.listVideoTasks(request)
    return new ListVideoTasksResponseVo(list, total, request)
  }

  /**
   * Volcengine video generation
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async volcVideoGeneration(request: VolcengineGenerationRequestDto) {
    const response = await this.videoService.volcengineCreate(request)
    return VolcengineVideoGenerationResponseVo.create(response)
  }

  /**
   * Volcengine video generation
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async volcVideoTaskStatus(request: VolcengineTaskQueryDto) {
    const response = await this.videoService.getVolcengineTask(request.userId, request.userType, request.taskId)
    return VolcengineTaskStatusResponseVo.create(response)
  }

  /**
   * Kling text to video generation
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async klingText2Video(request: KlingText2VideoRequestDto) {
    const response = await this.videoService.klingText2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * Kling image to video
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async klingImage2Video(request: KlingImage2VideoRequestDto) {
    const response = await this.videoService.klingImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * Kling multi-image to video
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async klingMultiImage2Video(request: KlingMultiImage2VideoRequestDto) {
    const response = await this.videoService.klingMultiImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * Kling video generation
   * @param request Video generation request parameters
   * @returns Video generation response
   */
  async getKlingTaskStatus(request: KlingTaskQueryDto) {
    const response = await this.videoService.getKlingTask(request.userId, request.userType, request.taskId)
    return KlingTaskStatusResponseVo.create(response)
  }

  /**
   * Markdown to card image
   * @param request MD2Card request parameters
   * @returns MD2Card generation result
   */
  async generateMd2Card(request: UserMd2CardDto) {
    const response = await this.imageService.userMd2Card(request)
    return Md2CardResponseVo.create(response)
  }

  /**
   * Fireflycard card image generation
   * @param request Fireflycard request parameters
   * @returns Fireflycard generation result
   */
  async generateFireflycard(request: UserFireflyCardDto) {
    const response = await this.imageService.userFireFlyCard(request)
    return FireflycardResponseVo.create(response)
  }

  /**
   * Get image generation model parameters
   * @param data Query parameters
   * @returns Image generation model parameters list
   */
  async getImageGenerationModels(data?: ImageGenerationModelsQueryDto) {
    const response = await this.imageService.generationModelConfig(data || {})
    return response.map((item: { name: string, description: string, sizes: string[], qualities: string[], styles: string[], pricing: string }) => ImageGenerationModelParamsVo.create(item))
  }

  /**
   * Get image editing model parameters
   * @param data Query parameters
   * @returns Image editing model parameters list
   */
  async getImageEditModels(data?: ImageEditModelsQueryDto) {
    const response = await this.imageService.editModelConfig(data || {})
    return response.map((item: { name: string, description: string, sizes: string[], pricing: string, maxInputImages: number }) => ImageEditModelParamsVo.create(item))
  }

  /**
   * Get video generation model parameters
   * @param data Query parameters
   * @returns Video generation model parameters list
   */
  async getVideoGenerationModels(data?: VideoGenerationModelsQueryDto) {
    const response = await this.videoService.getVideoGenerationModelParams(data || {})
    return response.map((item: VideoGenerationModelParamsVo) => VideoGenerationModelParamsVo.create(item))
  }

  /**
   * Get chat model parameters
   * @param data Query parameters
   * @returns Chat model parameters list
   */
  async getChatModels(data?: ChatModelsQueryDto) {
    const response = await this.chatService.getChatModelConfig(data || {})
    return response.map((item: ChatModelConfigVo) => ChatModelConfigVo.create(item))
  }

  /**
   * Dashscope text to video
   * @param request Text to video request parameters
   * @returns Video generation response
   */
  async dashscopeText2Video(request: DashscopeText2VideoRequestDto) {
    const response = await this.videoService.dashscopeText2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * Dashscope image to video
   * @param request Image to video request parameters
   * @returns Video generation response
   */
  async dashscopeImage2Video(request: DashscopeImage2VideoRequestDto) {
    const response = await this.videoService.dashscopeImage2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * Dashscope key frame to video
   * @param request Key frame to video request parameters
   * @returns Video generation response
   */
  async dashscopeKeyFrame2Video(request: DashscopeKeyFrame2VideoRequestDto) {
    const response = await this.videoService.dashscopeKeyFrame2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * Query Dashscope task status
   * @param request Task query request parameters
   * @returns Task status response
   */
  async getDashscopeTaskStatus(request: DashscopeTaskQueryDto) {
    const response = await this.videoService.getDashscopeTask(request.userId, request.userType, request.taskId)
    return DashscopeTaskStatusResponseVo.create(response)
  }

  // Intelligent image content generation
  async imgContentByAi(user: { userId: string, userType: UserType }, model: string, imgUrl: string, prompt: string, option?: {
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const messages: ChatMessageDto[] = []
    if (option?.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imgUrl,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }

  // Intelligent video content generation
  async videoContentByAi(user: { userId: string, userType: UserType }, model: string, videoUrl: string, prompt: string, option?: {
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user

    const messages: ChatMessageDto[] = []
    if (option?.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: [
        {
          type: 'video',
          video_url: {
            url: videoUrl,
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }

  // Return text content based on image
  async getContentByAi(user: { userId: string, userType: UserType }, model: string, prompt: string, option: {
    coverUrl?: string
    systemPrompt?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!prompt && !option.coverUrl)
      return ''

    const messages: ChatMessageDto[] = []
    if (option.systemPrompt) {
      messages.push({
        role: 'system',
        content: option.systemPrompt,
      })
    }

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: prompt,
      },
    ]
    if (option.coverUrl) {
      content.push({
        type: 'image_url',
        image_url: {
          url: option.coverUrl,
        },
      })
    }

    messages.push({
      role: 'user',
      content,
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }

  // Return text content based on image
  async getTitleByAi(user: { userId: string, userType: UserType }, model: string, prompt: string): Promise<string> {
    const { userId, userType } = user
    if (!prompt)
      return ''
    const systemContent = `Generate the content title based on the reference title and the original content. Keep the same language as the content, Just return the title text`

    const messages: ChatMessageDto[] = [{
      role: 'system',
      content: systemContent,
    }]

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: prompt,
      },
    ]

    messages.push({
      role: 'user',
      content,
    })

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages,
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }
}
