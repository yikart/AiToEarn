import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { VolcengineConfig } from './volcengine.config'
import {
  CreateVideoGenerationTaskRequest,
  CreateVideoGenerationTaskResponse,
  GetVideoGenerationTaskResponse,
} from './volcengine.interface'

@Injectable()
export class VolcengineService {
  private readonly logger = new Logger(VolcengineService.name)
  private readonly httpClient: AxiosInstance

  constructor(private readonly config: VolcengineConfig) {
    this.httpClient = this._createHttpClient()
  }

  /**
   * 创建HTTP客户端
   */
  private _createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  /**
   * 创建视频生成任务
   * POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
   */
  async createVideoGenerationTask(
    request: CreateVideoGenerationTaskRequest,
  ) {
    const response: AxiosResponse<CreateVideoGenerationTaskResponse> = await this.httpClient.post(
      '/api/v3/contents/generations/tasks',
      request,
    )

    return response.data
  }

  /**
   * 查询视频生成任务
   * GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{id}
   */
  async getVideoGenerationTask(
    taskId: string,
  ) {
    const response: AxiosResponse<GetVideoGenerationTaskResponse> = await this.httpClient.get(
      `/api/v3/contents/generations/tasks/${taskId}`,
    )

    return response.data
  }

  /**
   * 取消或删除视频生成任务
   * DELETE https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{id}
   */
  async deleteVideoGenerationTask(
    taskId: string,
  ) {
    await this.httpClient.delete(`/api/v3/contents/generations/tasks/${taskId}`)
  }
}
