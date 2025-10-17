import { Injectable } from '@nestjs/common'
import { ChatModelConfigVo, ChatModelsQueryDto, ChatService, UserChatCompletionDto } from './core/chat'
import { FireflycardResponseVo, ImageEditModelParamsVo, ImageEditModelsQueryDto, ImageGenerationModelParamsVo, ImageGenerationModelsQueryDto, ImageResponseVo, ImageService, Md2CardResponseVo, UserFireflyCardDto, UserImageEditDto, UserImageGenerationDto, UserMd2CardDto } from './core/image'
import { LogListQueryDto, LogListResponseVo, LogsService } from './core/logs'
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
}
