import { Injectable } from '@nestjs/common'
import { PaginationVo } from '@yikart/common'
import { NatsClient } from '@yikart/nats-client'
import {
  ChatCompletionVo,
  ChatModelConfigVo,
  FireflycardResponseVo,
  ImageEditModelParamsVo,
  ImageGenerationModelParamsVo,
  ImageResponseVo,
  KlingImage2VideoRequestDto,
  KlingMultiImage2VideoRequestDto,
  KlingTaskQueryDto,
  KlingTaskStatusResponseVo,
  KlingText2VideoRequestDto,
  KlingVideoGenerationResponseVo,
  // Logs interfaces
  LogDetailQueryDto,
  LogListQueryDto,
  LogVo,
  Md2CardResponseVo,
  // Chat interfaces
  UserChatCompletionDto,
  UserFireflyCardDto,
  UserImageEditDto,
  // Image interfaces
  UserImageGenerationDto,
  UserMd2CardDto,
  // Video interfaces
  UserVideoGenerationRequestDto,
  UserVideoTaskQueryDto,
  VideoGenerationModelParamsVo,
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
  async getChatModels(): Promise<ChatModelConfigVo[]> {
    return this.natsClient.send('ai.chat.models', {})
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
  async getImageGenerationModels(): Promise<ImageGenerationModelParamsVo[]> {
    return this.natsClient.send('ai.image.generation.models', {})
  }

  /**
   * 获取图片编辑模型参数
   */
  async getImageEditModels(): Promise<ImageEditModelParamsVo[]> {
    return this.natsClient.send('ai.image.edit.models', {})
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
   * 获取视频生成模型参数
   */
  async getVideoGenerationModels(): Promise<VideoGenerationModelParamsVo[]> {
    return this.natsClient.send('ai.video.generation.models', {})
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
  async getLogDetail(dto: LogDetailQueryDto): Promise<LogVo> {
    return this.natsClient.send('ai.logs.detail', dto)
  }
}
