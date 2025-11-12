import { Injectable, Logger } from '@nestjs/common'
import { UserType } from '@yikart/common'
import OpenAI from 'openai'
import { LogListResponseVo } from './ai.vo'
import { ChatModelConfigVo, ChatModelsQueryDto, ChatService, UserChatCompletionDto } from './core/chat'
import { FireflycardResponseVo, ImageEditModelParamsVo, ImageEditModelsQueryDto, ImageGenerationModelParamsVo, ImageGenerationModelsQueryDto, ImageResponseVo, ImageService, Md2CardResponseVo, TaskStatusResponseVo, UserFireflyCardDto, UserImageEditDto, UserImageGenerationDto, UserMd2CardDto } from './core/image'
import { LogListQueryDto, LogsService } from './core/logs'
import { DashscopeImage2VideoRequestDto, DashscopeKeyFrame2VideoRequestDto, DashscopeTaskQueryDto, DashscopeTaskStatusResponseVo, DashscopeText2VideoRequestDto, DashscopeVideoGenerationResponseVo, KlingImage2VideoRequestDto, KlingMultiImage2VideoRequestDto, KlingTaskQueryDto, KlingTaskStatusResponseVo, KlingText2VideoRequestDto, KlingVideoGenerationResponseVo, ListVideoTasksResponseVo, UserListVideoTasksQueryDto, UserVideoGenerationRequestDto, UserVideoTaskQueryDto, VideoGenerationModelParamsVo, VideoGenerationModelsQueryDto, VideoGenerationResponseVo, VideoService, VideoTaskStatusResponseVo, VolcengineGenerationRequestDto, VolcengineTaskQueryDto, VolcengineTaskStatusResponseVo, VolcengineVideoGenerationResponseVo } from './core/video'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  constructor(
    private readonly chatService: ChatService,
    private readonly logsService: LogsService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
  ) { }

  /**
   * 用户AI聊天
   * @param request 聊天请求参数
   * @returns AI聊天响应
   */
  async userAiChat(request: UserChatCompletionDto) {
    const response = await this.chatService.userChatCompletion(request)
    return response
  }

  /**
   * 获取用户AI使用日志
   * @param request 日志查询请求参数
   * @returns 用户日志响应
   */
  async getUserLogs(request: LogListQueryDto) {
    const [list, total] = await this.logsService.getLogList(request)
    return new LogListResponseVo(list, total, request)
  }

  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(request: UserImageGenerationDto) {
    const response = await this.imageService.userGeneration(request)
    return ImageResponseVo.create(response)
  }

  /**
   * 用户图片编辑
   * @param request 图片编辑请求参数
   * @returns 图片编辑响应
   */
  async userImageEdit(request: UserImageEditDto) {
    const response = await this.imageService.userEdit(request)
    return ImageResponseVo.create(response)
  }

  /**
   * 异步用户图片生成
   * @param request 图片生成请求参数
   * @returns 异步任务响应
   */
  async userImageGenerationAsync(request: UserImageGenerationDto) {
    const response = await this.imageService.userGenerationAsync(request)
    return response
  }

  /**
   * 异步用户图片编辑
   * @param request 图片编辑请求参数
   * @returns 异步任务响应
   */
  async userImageEditAsync(request: UserImageEditDto) {
    const response = await this.imageService.userEditAsync(request)
    return response
  }

  /**
   * 异步Markdown转卡片图片
   * @param request MD2Card请求参数
   * @returns 异步任务响应
   */
  async generateMd2CardAsync(request: UserMd2CardDto) {
    const response = await this.imageService.userMd2CardAsync(request)
    return response
  }

  /**
   * 异步Fireflycard生成卡片图片
   * @param request Fireflycard请求参数
   * @returns 异步任务响应
   */
  async generateFireflycardAsync(request: UserFireflyCardDto) {
    const response = await this.imageService.userFireFlyCardAsync(request)
    return response
  }

  /**
   * 查询图片任务状态
   * @param logId 任务日志ID
   * @returns 任务状态响应
   */
  async getImageTaskStatus(logId: string) {
    const response = await this.imageService.getTaskStatus(logId)
    return TaskStatusResponseVo.create(response)
  }

  /**
   * 通用视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async userVideoGeneration(request: UserVideoGenerationRequestDto) {
    const response = await this.videoService.userVideoGeneration(request)
    return VideoGenerationResponseVo.create(response)
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryDto) {
    const response = await this.videoService.getVideoTaskStatus(request)
    return VideoTaskStatusResponseVo.create(response)
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async listVideoTasks(request: UserListVideoTasksQueryDto) {
    const [list, total] = await this.videoService.listVideoTasks(request)
    return new ListVideoTasksResponseVo(list, total, request)
  }

  /**
   * 火山视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async volcVideoGeneration(request: VolcengineGenerationRequestDto) {
    const response = await this.videoService.volcengineCreate(request)
    return VolcengineVideoGenerationResponseVo.create(response)
  }

  /**
   * 火山视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async volcVideoTaskStatus(request: VolcengineTaskQueryDto) {
    const response = await this.videoService.getVolcengineTask(request.userId, request.userType, request.taskId)
    return VolcengineTaskStatusResponseVo.create(response)
  }

  /**
   * 可灵文本到视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async klingText2Video(request: KlingText2VideoRequestDto) {
    const response = await this.videoService.klingText2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * 可灵图生视频
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async klingImage2Video(request: KlingImage2VideoRequestDto) {
    const response = await this.videoService.klingImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * 可灵多图生视频
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async klingMultiImage2Video(request: KlingMultiImage2VideoRequestDto) {
    const response = await this.videoService.klingMultiImage2Video(request)
    return KlingVideoGenerationResponseVo.create(response)
  }

  /**
   * 可灵视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async getKlingTaskStatus(request: KlingTaskQueryDto) {
    const response = await this.videoService.getKlingTask(request.userId, request.userType, request.taskId)
    return KlingTaskStatusResponseVo.create(response)
  }

  /**
   * Markdown转卡片图片
   * @param request MD2Card请求参数
   * @returns MD2Card生成结果
   */
  async generateMd2Card(request: UserMd2CardDto) {
    const response = await this.imageService.userMd2Card(request)
    return Md2CardResponseVo.create(response)
  }

  /**
   * Fireflycard生成卡片图片
   * @param request Fireflycard请求参数
   * @returns Fireflycard生成结果
   */
  async generateFireflycard(request: UserFireflyCardDto) {
    const response = await this.imageService.userFireFlyCard(request)
    return FireflycardResponseVo.create(response)
  }

  /**
   * 获取图片生成模型参数
   * @param data 查询参数
   * @returns 图片生成模型参数列表
   */
  async getImageGenerationModels(data?: ImageGenerationModelsQueryDto) {
    const response = await this.imageService.generationModelConfig(data || {})
    return response.map((item: { name: string, description: string, sizes: string[], qualities: string[], styles: string[], pricing: string }) => ImageGenerationModelParamsVo.create(item))
  }

  /**
   * 获取图片编辑模型参数
   * @param data 查询参数
   * @returns 图片编辑模型参数列表
   */
  async getImageEditModels(data?: ImageEditModelsQueryDto) {
    const response = await this.imageService.editModelConfig(data || {})
    return response.map((item: { name: string, description: string, sizes: string[], pricing: string, maxInputImages: number }) => ImageEditModelParamsVo.create(item))
  }

  /**
   * 获取视频生成模型参数
   * @param data 查询参数
   * @returns 视频生成模型参数列表
   */
  async getVideoGenerationModels(data?: VideoGenerationModelsQueryDto) {
    const response = await this.videoService.getVideoGenerationModelParams(data || {})
    return response.map((item: VideoGenerationModelParamsVo) => VideoGenerationModelParamsVo.create(item))
  }

  /**
   * 获取对话模型参数
   * @param data 查询参数
   * @returns 对话模型参数列表
   */
  async getChatModels(data?: ChatModelsQueryDto) {
    const response = await this.chatService.getChatModelConfig(data || {})
    return response.map((item: ChatModelConfigVo) => ChatModelConfigVo.create(item))
  }

  /**
   * Dashscope 文生视频
   * @param request 文生视频请求参数
   * @returns 视频生成响应
   */
  async dashscopeText2Video(request: DashscopeText2VideoRequestDto) {
    const response = await this.videoService.dashscopeText2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * Dashscope 图生视频
   * @param request 图生视频请求参数
   * @returns 视频生成响应
   */
  async dashscopeImage2Video(request: DashscopeImage2VideoRequestDto) {
    const response = await this.videoService.dashscopeImage2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * Dashscope 首尾帧生视频
   * @param request 首尾帧生视频请求参数
   * @returns 视频生成响应
   */
  async dashscopeKeyFrame2Video(request: DashscopeKeyFrame2VideoRequestDto) {
    const response = await this.videoService.dashscopeKeyFrame2Video(request)
    return DashscopeVideoGenerationResponseVo.create(response)
  }

  /**
   * 查询 Dashscope 任务状态
   * @param request 任务查询请求参数
   * @returns 任务状态响应
   */
  async getDashscopeTaskStatus(request: DashscopeTaskQueryDto) {
    const response = await this.videoService.getDashscopeTask(request.userId, request.userType, request.taskId)
    return DashscopeTaskStatusResponseVo.create(response)
  }

  // 智能图片文案
  async imgContentByAi(user: { userId: string, userType: UserType }, model: string, imgUrl: string, prompt: string, option: {
    title?: string
    desc?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user

    const systemContent = `Generate copy based on the pictures and prompt words, as well as the reference titles and contents. Reply in ${option.language || 'English'}. The reply should not exceed ${option.max || 100} characters. Just return the copy.`
    let text = `prompt${prompt}.`
    if (option.title)
      text += `Reference Title: ${option.title}`
    if (option.desc)
      text += `Reference description: ${option.desc}`

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
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
              text,
            },
          ],
        },
      ],
    }

    try {
      const res = await this.userAiChat(request)
      return res.content as string || ''
    }
    catch (error) {
      this.logger.log({ data: error, path: '======= imgContentByAi error =======' })
      return ''
    }
  }

  // 智能视频文案
  async videoContentByAi(user: { userId: string, userType: UserType }, model: string, videoUrl: string, prompt: string, option: {
    title?: string
    desc?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user

    const systemContent = `Generate copy based on the video and prompt words, as well as the reference titles and contents. Reply in ${option.language || 'English'}. The reply should not exceed ${option.max || 100} characters. Just return the copy.`
    let text = `prompt${prompt}.`
    if (option.title)
      text += `Reference Title: ${option.title}`
    if (option.desc)
      text += `Reference description: ${option.desc}`

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
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
              text,
            },
          ],
        },
      ],
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }

  // 根据图片返回文字内容
  async getContentByAi(user: { userId: string, userType: UserType }, model: string, prompt: string, option: {
    coverUrl?: string
    title?: string
    desc?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!option.desc && !option.coverUrl)
      return ''

    const systemContent = `Based on the cover image, refer to the title and the original content to generate beautiful copy. Reply in ${option.language || 'English'} and the content of your reply should not exceed ${option.max || 100} words. Just return the copy`

    let text = `prompt${prompt}.`
    if (option.title)
      text += `Reference Title: ${option.title}`
    if (option.desc)
      text += `Reference description: ${option.desc}`

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text,
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
    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content,
        },
      ],
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }

  // 根据图片返回文字内容
  async getTitleByAi(user: { userId: string, userType: UserType }, model: string, desc: string, option: {
    title?: string
    max?: number
    language?: string
  }): Promise<string> {
    const { userId, userType } = user
    if (!desc)
      return ''

    const systemContent = `Generate the content title based on the reference title and the original content. Please reply in ${option.language || 'English'} and the content of your reply should not exceed  ${option.max || 100} words. Just return the title text`

    let text = `Original content: ${desc}. `
    if (option.title)
      text += `Reference Title: ${option.title}`

    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text,
      },
    ]

    const request: UserChatCompletionDto = {
      userId,
      userType,
      model,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content,
        },
      ],
    }

    const res = await this.userAiChat(request)
    return res.content as string || ''
  }
}
