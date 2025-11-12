import { Injectable } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AxiosRequestConfig } from 'axios'
import {
  ChatCompletionVo,
  ChatModelConfigVo,
  FireflycardResponseVo,
  ImageResponseVo,
  ListVideoTasksResponseVo,
  ModelsConfigDto,
  ModelsConfigVo,
  UserChatCompletionDto,
  UserImageGenerationDto,
  UserVideoGenerationRequestDto,
  VideoGenerationModelParamsVo,
  VideoGenerationResponseVo,
  VideoTaskStatusResponseVo,
} from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class AiService extends BaseService {
  async chatCompletion(data: UserChatCompletionDto) {
    const url = `/internal/ai/chat/completion`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ChatCompletionVo>(
      url,
      config,
    )
    return res
  }

  async imageGenerate(data: UserImageGenerationDto) {
    const url = `/internal/ai/image/generate`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ImageResponseVo>(
      url,
      config,
    )
    return res
  }

  async getImageGenerationModels(
    data: {
      userId: string
      userType: UserType
    },
  ) {
    const url = `/internal/ai/models/image/generation`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request(
      url,
      config,
    )
    return res
  }

  async saveModelsConfig(config: ModelsConfigDto) {
    const url = `/internal/ai/models/config`
    const axiosConfig: AxiosRequestConfig = {
      method: 'POST',
      data: config,
    }
    const res = await this.request<void>(
      url,
      axiosConfig,
    )
    return res
  }

  async getModelsConfig() {
    const url = `/internal/ai/models/config/get`
    const config: AxiosRequestConfig = {
      method: 'POST',
    }
    const res = await this.request<ModelsConfigVo>(
      url,
      config,
    )
    return res
  }

  async videoGeneration(data: UserVideoGenerationRequestDto): Promise<VideoGenerationResponseVo> {
    const url = `/internal/ai/video/generations`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<VideoGenerationResponseVo>(
      url,
      config,
    )
    return res
  }

  async getVideoTaskStatus(data: {
    userId: string
    userType: UserType
    taskId: string
  }): Promise<VideoTaskStatusResponseVo> {
    const url = `/internal/ai/video/status`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<VideoTaskStatusResponseVo>(
      url,
      config,
    )
    return res
  }

  async listVideoTasks(data: {
    userId: string
    userType: UserType
    page?: number
    pageSize?: number
  }): Promise<ListVideoTasksResponseVo> {
    const url = `/internal/ai/video/list`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ListVideoTasksResponseVo>(
      url,
      config,
    )
    return res
  }

  async generateFireflycard(data: {
    userId: string
    userType: UserType
    content: string
    temp: string
    title?: string
    style?: Record<string, unknown>
    switchConfig?: Record<string, unknown>
  }): Promise<FireflycardResponseVo> {
    const url = `/internal/ai/fireflycard`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<FireflycardResponseVo>(
      url,
      config,
    )
    return res
  }

  async getVideoGenerationModels(data: {
    userId?: string
    userType?: UserType
  }): Promise<VideoGenerationModelParamsVo[]> {
    const url = `/internal/ai/models/video/generation`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<VideoGenerationModelParamsVo[]>(
      url,
      config,
    )
    return res
  }

  async getChatModels(data: {
    userId?: string
    userType?: UserType
  }): Promise<ChatModelConfigVo[]> {
    const url = `/internal/ai/models/chat`
    const config: AxiosRequestConfig = {
      method: 'POST',
      data,
    }
    const res = await this.request<ChatModelConfigVo[]>(
      url,
      config,
    )
    return res
  }
}
