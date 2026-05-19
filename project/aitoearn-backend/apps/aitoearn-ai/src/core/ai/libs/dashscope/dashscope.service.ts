import { Injectable } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AiAvailabilityService } from '../../../ai-availability'
import { DashscopeConfig } from './dashscope.config'
import { DashscopeCreateVideoTaskRequest, DashscopeCreateVideoTaskResponse, DashscopeQueryVideoTaskResponse } from './dashscope.interface'

@Injectable()
export class DashscopeService {
  private readonly httpClient: AxiosInstance

  constructor(
    private readonly config: DashscopeConfig,
    private readonly aiAvailability: AiAvailabilityService,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  async createVideoTask(request: DashscopeCreateVideoTaskRequest): Promise<DashscopeCreateVideoTaskResponse> {
    return this.aiAvailability.execute(
      { provider: 'dashscope', operation: 'createVideoTask', model: request.model },
      async () => {
        const response: AxiosResponse<DashscopeCreateVideoTaskResponse> = await this.httpClient.post(
          '/api/v1/services/aigc/video-generation/video-synthesis',
          request,
          { headers: { 'X-DashScope-Async': 'enable' } },
        )
        return response.data
      },
    )
  }

  async getVideoTask(taskId: string): Promise<DashscopeQueryVideoTaskResponse> {
    return this.aiAvailability.execute(
      { provider: 'dashscope', operation: 'getVideoTask' },
      async () => {
        const response: AxiosResponse<DashscopeQueryVideoTaskResponse> = await this.httpClient.get(
          `/api/v1/tasks/${encodeURIComponent(taskId)}`,
        )
        return response.data
      },
    )
  }
}
