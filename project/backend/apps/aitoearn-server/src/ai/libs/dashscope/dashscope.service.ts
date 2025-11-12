import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { DashscopeConfig } from './dashscope.config'
import {
  CreateVideoTaskResponse,
  GetVideoTaskResponse,
  ImageToVideoRequest,
  KeyFrameToVideoRequest,
  TextToVideoRequest,
} from './dashscope.interface'

@Injectable()
export class DashscopeService {
  private readonly logger = new Logger(DashscopeService.name)
  private readonly httpClient: AxiosInstance

  constructor(private readonly config: DashscopeConfig) {
    this.httpClient = this._createHttpClient()
  }

  /**
   * 创建HTTP客户端
   */
  private _createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-DashScope-Async': 'enable',
      },
    })
  }

  /**
   * 创建图生视频任务
   * POST https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis
   */
  async createImageToVideoTask(
    request: ImageToVideoRequest,
  ): Promise<CreateVideoTaskResponse> {
    const response: AxiosResponse<CreateVideoTaskResponse> = await this.httpClient.post(
      '/api/v1/services/aigc/video-generation/video-synthesis',
      request,
    )
    return response.data
  }

  /**
   * 创建首尾帧生视频任务
   * POST https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis
   */
  async createKeyFrameToVideoTask(
    request: KeyFrameToVideoRequest,
  ): Promise<CreateVideoTaskResponse> {
    const response: AxiosResponse<CreateVideoTaskResponse> = await this.httpClient.post(
      '/api/v1/services/aigc/image2video/video-synthesis',
      request,
    )
    return response.data
  }

  /**
   * 创建文生视频任务
   * POST https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis
   */
  async createTextToVideoTask(
    request: TextToVideoRequest,
  ): Promise<CreateVideoTaskResponse> {
    const response: AxiosResponse<CreateVideoTaskResponse> = await this.httpClient.post(
      '/api/v1/services/aigc/video-generation/video-synthesis',
      request,
    )
    return response.data
  }

  /**
   * 查询视频生成任务
   * GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}
   */
  async getVideoTask(taskId: string): Promise<GetVideoTaskResponse> {
    const response: AxiosResponse<GetVideoTaskResponse> = await this.httpClient.get(
      `/api/v1/tasks/${taskId}`,
    )
    return response.data
  }
}
