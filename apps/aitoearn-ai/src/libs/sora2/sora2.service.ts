import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { Sora2Config } from './sora2.config'
import {
  CreateVideoGenerationTaskRequest,
  CreateVideoGenerationTaskResponse,
  GetVideoGenerationTaskResponse,
} from './sora2.interface'

@Injectable()
export class Sora2Service {
  private readonly logger = new Logger(Sora2Service.name)
  private readonly httpClient: AxiosInstance

  constructor(private readonly config: Sora2Config) {
    this.httpClient = this._createHttpClient()
  }

  /**
   * 创建HTTP客户端
   */
  private _createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  /**
   * 创建视频生成任务
   */
  async createVideoGenerationTask(
    request: CreateVideoGenerationTaskRequest,
  ) {
    const response: AxiosResponse<CreateVideoGenerationTaskResponse> = await this.httpClient.post(
      '/v1/video/create',
      request,
    )

    return response.data
  }

  /**
   * 查询视频生成任务
   */
  async getVideoGenerationTask(
    taskId: string,
  ) {
    const response: AxiosResponse<GetVideoGenerationTaskResponse> = await this.httpClient.get(
      `/v1/video/query`,
      {
        params: { id: taskId },
      },
    )

    return response.data
  }
}
