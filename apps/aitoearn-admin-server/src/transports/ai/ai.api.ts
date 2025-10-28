import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { ListVideoTasksResponseVo } from '../../core/ai/ai.vo'
import { ChatModelsQueryDto, FireflycardResponseVo, UserFireflyCardDto, UserListVideoTasksQueryDto, VideoGenerationModelsQueryDto } from '../../core/ai/dto'
import { ServerBaseApi } from '../serverBase.api'
import {
  ChatModel,
  ImageGenerationRequest,
  ImageResponse,
  VideoGenerationCommonRequest,
  VideoGenerationModel,
  VideoGenerationResponse,
  VideoTaskQueryRequest,
  VideoTaskStatusResponse,
} from './ai.interface'

@Injectable()
export class AiApi extends ServerBaseApi {
  /**
   * 用户图片生成
   * @param request 图片生成请求参数
   * @returns 图片生成响应
   */
  async userImageGeneration(
    request: ImageGenerationRequest,
  ): Promise<ImageResponse> {
    const res = await this.sendMessage<ImageResponse>(
      'internal/ai/image/generations',
      request,
    )
    return res
  }

  /**
   * 通用视频生成
   * @param request 视频生成请求参数
   * @returns 视频生成响应
   */
  async userVideoGeneration(request: VideoGenerationCommonRequest): Promise<VideoGenerationResponse> {
    return await this.sendMessage<VideoGenerationResponse>(
      'internal/ai/video/generations',
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
}
