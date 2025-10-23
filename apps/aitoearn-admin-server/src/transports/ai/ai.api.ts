import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { DashscopeVideoGenerationResponseVo, ListVideoTasksResponseVo } from '../../core/ai/ai.vo'
import { ChatModelsQueryDto, DashscopeImage2VideoRequestDto, FireflycardResponseVo, UserFireflyCardDto, UserListVideoTasksQueryDto, VideoGenerationModelsQueryDto } from '../../core/ai/dto'
import { ServerBaseApi } from '../serverBase.api'
import {
  AiChatRequest,
  AiChatResponse,
  ChatModel,
  FireflycardGenerationRequest,
  FireflycardGenerationResponse,
  ImageEditModel,
  ImageEditRequest,
  ImageGenerationModel,
  ImageGenerationRequest,
  ImageResponse,
  ImageVariationRequest,
  Md2CardGenerationRequest,
  Md2CardGenerationResponse,
  VideoGenerationCommonRequest,
  VideoGenerationModel,
  VideoGenerationResponse,
  VideoTaskQueryRequest,
  VideoTaskStatusResponse,
} from './ai.interface'

@Injectable()
export class AiApi extends ServerBaseApi {
  /**
   * 用户AI聊天
   * @param request 聊天请求参数
   * @returns AI聊天响应
   */
  async userAiChat(request: AiChatRequest): Promise<AiChatResponse> {
    return await this.sendMessage<AiChatResponse>(
      'ai/chat/generations',
      request,
    )
  }

  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(
    request: ImageGenerationRequest,
  ): Promise<ImageResponse> {
    return await this.sendMessage<ImageResponse>(
      'ai/image/generations',
      request,
    )
  }

  /**
   * 用户图片编辑
   * @param request 图片编辑请求参数
   * @returns 图片编辑响应
   */
  async userImageEdit(
    request: ImageEditRequest,
  ): Promise<ImageResponse> {
    return await this.sendMessage<ImageResponse>(
      'ai/image/edits',
      request,
    )
  }

  /**
   * 用户图片变体
   * @param request 图片变体请求参数
   * @returns 图片变体响应
   */
  async userImageVariation(
    request: ImageVariationRequest,
  ): Promise<ImageResponse> {
    return await this.sendMessage<ImageResponse>(
      'ai/image/variations',
      request,
    )
  }

  /**
   * 通用视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async userVideoGeneration(request: VideoGenerationCommonRequest): Promise<VideoGenerationResponse> {
    return await this.sendMessage<VideoGenerationResponse>(
      'ai/video/generations',
      request,
    )
  }

  /**
   * 查询视频任务状态
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async getVideoTaskStatus(request: VideoTaskQueryRequest): Promise<VideoTaskStatusResponse> {
    return await this.sendMessage<VideoTaskStatusResponse>(
      'ai/video/task/query',
      request,
    )
  }

  /**
   * 查询视频任务列表
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async listVideoTasks(request: UserListVideoTasksQueryDto & {
    userId: string
    userType: UserType
  }): Promise<ListVideoTasksResponseVo> {
    return await this.sendMessage<ListVideoTasksResponseVo>(
      'ai/video/task/list',
      request,
    )
  }

  /**
   * 查询视频任务列表
   * @param request 视频任务查询请求参数
   * @returns 视频任务状态响应
   */
  async fireflyCard(request: UserFireflyCardDto & {
    userId: string
    userType: UserType
  }): Promise<FireflycardResponseVo> {
    return await this.sendMessage<FireflycardResponseVo>(
      'ai/firefly-card/generate',
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
      'ai/md2card/generate',
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
      'ai/fireflycard/generate',
      request,
    )
  }

  /**
   * 获取图片生成模型参数
   * @returns 图片生成模型参数列表
   */
  async getImageGenerationModels(): Promise<ImageGenerationModel[]> {
    return await this.sendMessage<ImageGenerationModel[]>(
      'ai/image/generation/models',
      {},
    )
  }

  /**
   * 获取图片编辑模型参数
   * @returns 图片编辑模型参数列表
   */
  async getImageEditModels(): Promise<ImageEditModel[]> {
    return await this.sendMessage<ImageEditModel[]>(
      'ai/image/edit/models',
      {},
    )
  }

  /**
   * 获取视频生成模型参数
   * @param data 模型查询参数
   * @returns 视频生成模型参数列表
   */
  async getVideoGenerationModels(data: VideoGenerationModelsQueryDto): Promise<VideoGenerationModel[]> {
    return await this.sendMessage<VideoGenerationModel[]>(
      'ai/video/generation/models',
      data,
    )
  }

  /**
   * 获取视频生成模型参数
   * @param data 模型查询参数
   * @returns 视频生成模型参数列表
   */
  async getChatModels(data: ChatModelsQueryDto): Promise<ChatModel[]> {
    return await this.sendMessage<ChatModel[]>(
      'ai/chat/models',
      data,
    )
  }

  async dashscopeImage2Video(data: DashscopeImage2VideoRequestDto): Promise<DashscopeVideoGenerationResponseVo> {
    return await this.sendMessage<DashscopeVideoGenerationResponseVo>(
      'ai/video/dashscope/image2video',
      data,
    )
  }
}
