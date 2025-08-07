import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'
import {
  FireflycardGenerationRequest,
  FireflycardGenerationResponse,
  ImageEditModel,
  ImageGenerationModel,
  Md2CardGenerationRequest,
  Md2CardGenerationResponse,
  MjTaskFetchResponse,
  MjVideoSubmitResponse,
  UserAiChatRequest,
  UserAiChatResponse,
  UserImageEditRequest,
  UserImageGenerationRequest,
  UserImageResponse,
  UserImageVariationRequest,
  UserLogsQueryRequest,
  UserLogsResponse,
  UserVideoGenerationCommonRequest,
  UserVideoGenerationRequest,
  UserVideoTaskQueryRequest,
  VideoGenerationModel,
  VideoGenerationResponse,
  VideoTaskStatusQueryRequest,
  VideoTaskStatusResponse,
} from './ai.interface'

@Injectable()
export class AiNatsApi extends BaseNatsApi {
  /**
   * 用户AI聊天
   * @param request 聊天请求参数
   * @returns AI聊天响应
   */
  async userAiChat(request: UserAiChatRequest): Promise<UserAiChatResponse> {
    return await this.sendMessage<UserAiChatResponse>(
      NatsApi.ai.user.chat,
      request,
    )
  }

  /**
   * 获取用户AI使用日志
   * @param request 日志查询请求参数
   * @returns 用户日志响应
   */
  async getUserLogs(request: UserLogsQueryRequest): Promise<UserLogsResponse> {
    return await this.sendMessage<UserLogsResponse>(
      NatsApi.ai.user.logs,
      request,
    )
  }

  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(
    request: UserImageGenerationRequest,
  ): Promise<UserImageResponse> {
    return await this.sendMessage<UserImageResponse>(
      NatsApi.ai.user.imageGenerations,
      request,
    )
  }

  /**
   * 用户图片编辑
   * @param request 图片编辑请求参数
   * @returns 图片编辑响应
   */
  async userImageEdit(
    request: UserImageEditRequest,
  ): Promise<UserImageResponse> {
    return await this.sendMessage<UserImageResponse>(
      NatsApi.ai.user.imageEdits,
      request,
    )
  }

  /**
   * 用户图片变体
   * @param request 图片变体请求参数
   * @returns 图片变体响应
   */
  async userImageVariation(
    request: UserImageVariationRequest,
  ): Promise<UserImageResponse> {
    return await this.sendMessage<UserImageResponse>(
      NatsApi.ai.user.imageVariations,
      request,
    )
  }

  /**
   * MJ视频生成
   * @param request MJ视频生成请求参数
   * @returns MJ视频任务提交响应
   */
  async userMjSubmitVideo(request: UserVideoGenerationRequest): Promise<MjVideoSubmitResponse> {
    return await this.sendMessage<MjVideoSubmitResponse>(
      NatsApi.ai.user.mjSubmitVideo,
      request,
    )
  }

  /**
   * MJ任务查询
   * @param request MJ任务查询请求参数
   * @returns MJ任务查询响应
   */
  async userMjTaskFetch(request: VideoTaskStatusQueryRequest): Promise<MjTaskFetchResponse> {
    return await this.sendMessage<MjTaskFetchResponse>(
      NatsApi.ai.user.mjTaskFetch,
      request,
    )
  }

  /**
   * 通用视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async userVideoGeneration(request: UserVideoGenerationCommonRequest): Promise<VideoGenerationResponse> {
    return await this.sendMessage<VideoGenerationResponse>(
      NatsApi.ai.user.videoGenerations,
      request,
    )
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async getVideoTaskStatus(request: UserVideoTaskQueryRequest): Promise<VideoTaskStatusResponse> {
    return await this.sendMessage<VideoTaskStatusResponse>(
      NatsApi.ai.user.videoTaskQuery,
      request,
    )
  }

  /**
   * Markdown转卡片图片
   * @param request MD2Card请求参数
   * @returns MD2Card生成结果
   */
  async generateMd2Card(request: Md2CardGenerationRequest): Promise<Md2CardGenerationResponse> {
    return await this.sendMessage<Md2CardGenerationResponse>(
      NatsApi.ai.user.md2card,
      request,
    )
  }

  /**
   * Fireflycard生成卡片图片
   * @param request Fireflycard请求参数
   * @returns Fireflycard生成结果
   */
  async generateFireflycard(request: FireflycardGenerationRequest): Promise<FireflycardGenerationResponse> {
    return await this.sendMessage<FireflycardGenerationResponse>(
      NatsApi.ai.user.fireflycard,
      request,
    )
  }

  /**
   * 获取图片生成模型参数
   * @returns 图片生成模型参数列表
   */
  async getImageGenerationModels(): Promise<ImageGenerationModel[]> {
    return await this.sendMessage<ImageGenerationModel[]>(
      NatsApi.ai.user.imageGenerationModels,
      {},
    )
  }

  /**
   * 获取图片编辑模型参数
   * @returns 图片编辑模型参数列表
   */
  async getImageEditModels(): Promise<ImageEditModel[]> {
    return await this.sendMessage<ImageEditModel[]>(
      NatsApi.ai.user.imageEditModels,
      {},
    )
  }

  /**
   * 获取视频生成模型参数
   * @returns 视频生成模型参数列表
   */
  async getVideoGenerationModels(): Promise<VideoGenerationModel[]> {
    return await this.sendMessage<VideoGenerationModel[]>(
      NatsApi.ai.user.videoGenerationModels,
      {},
    )
  }
}
