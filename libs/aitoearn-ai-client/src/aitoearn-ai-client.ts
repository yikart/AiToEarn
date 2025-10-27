import { Injectable } from '@nestjs/common'
import { PaginationVo } from '@yikart/common'
import { NatsClient } from '@yikart/nats-client'
import {
  ChatCompletionVo,
  ChatModelConfigVo,
  ChatModelsQueryDto,
  DashscopeImage2VideoRequestDto,
  DashscopeKeyFrame2VideoRequestDto,
  DashscopeTaskQueryDto,
  DashscopeTaskStatusResponseVo,
  DashscopeText2VideoRequestDto,
  DashscopeVideoGenerationResponseVo,
  FireflycardResponseVo,
  ImageEditModelParamsVo,
  ImageEditModelsQueryDto,
  ImageGenerationModelParamsVo,
  ImageGenerationModelsQueryDto,
  ImageResponseVo,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingTaskQueryDto,
  KlingTaskStatusResponseVo,
  KlingText2VideoRequestDto,
  KlingVideoGenerationResponseVo,
  // Logs interfaces
  LogDetailQueryDto,
  LogDetailVo,
  LogListQueryDto,
  LogVo,
  Md2CardResponseVo,
  ModelsConfigDto,
  ModelsConfigVo,
  Sora2GenerationRequestDto,
  Sora2TaskQueryDto,
  Sora2TaskStatusResponseVo,
  Sora2VideoGenerationResponseVo,
  // Chat interfaces
  UserChatCompletionDto,
  UserFireflyCardDto,
  UserImageEditDto,
  // Image interfaces
  UserImageGenerationDto,
  UserListVideoTasksQueryDto,
  UserMd2CardDto,
  // Video interfaces
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VideoGenerationModelParamsVo,
  VideoGenerationModelsQueryDto,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
  VolcengineGenerationRequestDto,
  VolcengineTaskQueryDto,
  VolcengineTaskStatusResponseVo,
  VolcengineVideoGenerationResponseVo,
} from './aitoearn-ai-client.interface'

@Injectable()
export class AitoearnAiClient {
  constructor(private readonly natsClient: NatsClient) {}

  // ==================== Chat Module Methods ====================

  /**
   * 用户聊天完成
   */
  async chatCompletion(data: UserChatCompletionDto): Promise<ChatCompletionVo> {
    return this.natsClient.send('ai.chat.completion', data)
  }

  /**
   * 获取聊天模型配置
   */
  async getChatModels(data?: ChatModelsQueryDto): Promise<ChatModelConfigVo[]> {
    return this.natsClient.send('ai.chat.models', data || {})
  }

  // ==================== Image Module Methods ====================

  /**
   * 用户图片生成
   */
  async imageGeneration(data: UserImageGenerationDto): Promise<ImageResponseVo> {
    return this.natsClient.send('ai.image.generations', data)
  }

  /**
   * 用户图片编辑
   */
  async imageEdit(data: UserImageEditDto): Promise<ImageResponseVo> {
    return this.natsClient.send('ai.image.edits', data)
  }

  /**
   * 获取图片生成模型参数
   */
  async getImageGenerationModels(data?: ImageGenerationModelsQueryDto): Promise<ImageGenerationModelParamsVo[]> {
    return this.natsClient.send('ai.image.generation.models', data || {})
  }

  /**
   * 获取图片编辑模型参数
   */
  async getImageEditModels(data?: ImageEditModelsQueryDto): Promise<ImageEditModelParamsVo[]> {
    return this.natsClient.send('ai.image.edit.models', data || {})
  }

  /**
   * 用户 Markdown 转卡片
   */
  async md2Card(data: UserMd2CardDto): Promise<Md2CardResponseVo> {
    return this.natsClient.send('ai.md2card.generate', data)
  }

  /**
   * 用户流光卡片生成
   */
  async fireflyCard(data: UserFireflyCardDto): Promise<FireflycardResponseVo> {
    return this.natsClient.send('ai.firefly-card.generate', data)
  }

  // ==================== Video Module Methods ====================

  /**
   * 用户视频生成
   */
  async videoGeneration(data: UserVideoGenerationRequestDto): Promise<VideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.generations', data)
  }

  /**
   * 查询用户视频任务状态
   */
  async getVideoTaskStatus(data: UserVideoTaskQueryDto): Promise<VideoTaskStatusResponseVo> {
    return this.natsClient.send('ai.video.task.query', data)
  }

  /**
   * 查询用户视频任务状态
   */
  async listVideoTasks(data: UserListVideoTasksQueryDto): Promise<PaginationVo<VideoTaskStatusResponseVo>> {
    return this.natsClient.send('ai.video.task.list', data)
  }

  /**
   * 获取视频生成模型参数
   */
  async getVideoGenerationModels(data?: VideoGenerationModelsQueryDto): Promise<VideoGenerationModelParamsVo[]> {
    return this.natsClient.send('ai.video.generation.models', data || {})
  }

  /**
   * Kling 文生视频
   */
  async klingText2Video(data: KlingText2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.kling.text2video', data)
  }

  /**
   * Kling 图生视频
   */
  async klingImage2Video(data: KlingImage2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.kling.image2video', data)
  }

  /**
   * Kling 多图生视频
   */
  async klingMultiImage2Video(data: KlingMultiImage2VideoRequestDto): Promise<KlingVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.kling.multi-image2video', data)
  }

  /**
   * 查询 Kling 任务状态
   */
  async getKlingTaskStatus(data: KlingTaskQueryDto): Promise<KlingTaskStatusResponseVo> {
    return this.natsClient.send('ai.video.kling.task.query', data)
  }

  /**
   * Volcengine 视频生成
   */
  async volcengineCreate(data: VolcengineGenerationRequestDto): Promise<VolcengineVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.volcengine.generation', data)
  }

  /**
   * 查询 Volcengine 任务状态
   */
  async getVolcengineTaskStatus(data: VolcengineTaskQueryDto): Promise<VolcengineTaskStatusResponseVo> {
    return this.natsClient.send('ai.video.volcengine.task.query', data)
  }

  /**
   * Dashscope 文生视频
   */
  async dashscopeText2Video(data: DashscopeText2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.dashscope.text2video', data)
  }

  /**
   * Dashscope 图生视频
   */
  async dashscopeImage2Video(data: DashscopeImage2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.dashscope.image2video', data)
  }

  /**
   * Dashscope 首尾帧生视频
   */
  async dashscopeKeyFrame2Video(data: DashscopeKeyFrame2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.dashscope.keyframe2video', data)
  }

  /**
   * 查询 Dashscope 任务状态
   */
  async getDashscopeTaskStatus(data: DashscopeTaskQueryDto): Promise<DashscopeTaskStatusResponseVo> {
    return this.natsClient.send('ai.video.dashscope.task.query', data)
  }

  // ==================== Logs Module Methods ====================

  /**
   * 获取日志列表
   */
  async getLogList(dto: LogListQueryDto): Promise<PaginationVo<LogVo>> {
    return this.natsClient.send('ai.logs.list', dto)
  }

  /**
   * 获取日志详情
   */
  async getLogDetail(dto: LogDetailQueryDto): Promise<LogDetailVo> {
    return this.natsClient.send('ai.logs.detail', dto)
  }

  // ==================== Models Config Module Methods ====================

  /**
   * 获取模型配置
   */
  async getModelsConfig(): Promise<ModelsConfigVo> {
    return this.natsClient.send('ai.models-config.get', {})
  }

  /**
   * 保存模型配置
   */
  async saveModelsConfig(data: ModelsConfigDto): Promise<void> {
    return this.natsClient.send('ai.models-config.save', data)
  }

  // Sora2 相关方法
  async generateSora2Video(data: Sora2GenerationRequestDto): Promise<Sora2VideoGenerationResponseVo> {
    return this.natsClient.send('ai.video.sora2.generation', data)
  }

  async getSora2TaskStatus(data: Sora2TaskQueryDto): Promise<Sora2TaskStatusResponseVo> {
    return this.natsClient.send('ai.video.sora2.task.query', data)
  }
}
