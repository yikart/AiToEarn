import { Injectable } from '@nestjs/common'
import {
  ChatModel,
  FireflycardGenerationRequest,
  ImageEditModel,
  ImageGenerationModel,
  Md2CardGenerationRequest,
  UserAiChatRequest,
  UserImageEditRequest,
  UserImageGenerationRequest,
  UserImageVariationRequest,
  UserLogsQueryRequest,
  UserVideoGenerationCommonRequest,
  UserVideoGenerationRequest,
  UserVideoTaskQueryRequest,
  VideoGenerationModel,
  VideoTaskStatusQueryRequest,
} from '@transports/ai/ai.interface'
import { AiNatsApi } from '@transports/ai/ai.natsApi'

@Injectable()
export class AiService {
  constructor(private readonly aiNatsApi: AiNatsApi) {}

  /**
   * 用户AI聊天
   * @param request 聊天请求参数
   * @returns AI聊天响应
   */
  async userAiChat(request: UserAiChatRequest) {
    return await this.aiNatsApi.userAiChat(request)
  }

  /**
   * 获取用户AI使用日志
   * @param request 日志查询请求参数
   * @returns 用户日志响应
   */
  async getUserLogs(request: UserLogsQueryRequest) {
    return await this.aiNatsApi.getUserLogs(request)
  }

  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(request: UserImageGenerationRequest) {
    return await this.aiNatsApi.userImageGeneration(request)
  }

  /**
   * 用户图片编辑
   * @param request 图片编辑请求参数
   * @returns 图片编辑响应
   */
  async userImageEdit(request: UserImageEditRequest) {
    return await this.aiNatsApi.userImageEdit(request)
  }

  /**
   * 用户图片变体
   * @param request 图片变体请求参数
   * @returns 图片变体响应
   */
  async userImageVariation(request: UserImageVariationRequest) {
    return await this.aiNatsApi.userImageVariation(request)
  }

  /**
   * MJ视频生成
   * @param request MJ视频生成请求参数
   * @returns MJ视频任务提交响应
   */
  async userMjSubmitVideo(request: UserVideoGenerationRequest) {
    return await this.aiNatsApi.userMjSubmitVideo(request)
  }

  /**
   * MJ任务查询
   * @param request MJ任务查询请求参数
   * @returns MJ任务查询响应
   */
  async userMjTaskFetch(request: VideoTaskStatusQueryRequest) {
    return await this.aiNatsApi.userMjTaskFetch(request)
  }

  /**
   * 通用视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async userVideoGeneration(request: UserVideoGenerationCommonRequest) {
    return await this.aiNatsApi.userVideoGeneration(request)
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryRequest) {
    return await this.aiNatsApi.getVideoTaskStatus(request)
  }

  /**
   * Markdown转卡片图片
   * @param request MD2Card请求参数
   * @returns MD2Card生成结果
   */
  async generateMd2Card(request: Md2CardGenerationRequest) {
    return await this.aiNatsApi.generateMd2Card(request)
  }

  /**
   * Fireflycard生成卡片图片
   * @param request Fireflycard请求参数
   * @returns Fireflycard生成结果
   */
  async generateFireflycard(request: FireflycardGenerationRequest) {
    return await this.aiNatsApi.generateFireflycard(request)
  }

  /**
   * 获取图片生成模型参数
   * @returns 图片生成模型参数列表
   */
  async getImageGenerationModels(): Promise<ImageGenerationModel[]> {
    return await this.aiNatsApi.getImageGenerationModels()
  }

  /**
   * 获取图片编辑模型参数
   * @returns 图片编辑模型参数列表
   */
  async getImageEditModels(): Promise<ImageEditModel[]> {
    return await this.aiNatsApi.getImageEditModels()
  }

  /**
   * 获取视频生成模型参数
   * @returns 视频生成模型参数列表
   */
  async getVideoGenerationModels(): Promise<VideoGenerationModel[]> {
    return await this.aiNatsApi.getVideoGenerationModels()
  }

  /**
   * 获取对话模型参数
   * @returns 对话模型参数列表
   */
  async getChatModels(): Promise<ChatModel[]> {
    return await this.aiNatsApi.getChatModels()
  }
}
