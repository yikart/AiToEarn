import { Injectable } from '@nestjs/common'
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { AiAvailabilityService } from '../../../ai-availability'
import { RelayConfig } from './relay.config'
import { RelayVideoCallbackDto, RelayVideoGenerationRequest, RelayVideoSubmitResponse } from './relay.interface'

interface RelayCommonResponse<T> {
  data: T
}

@Injectable()
export class RelayLibService {
  private readonly httpClient: AxiosInstance

  constructor(
    private readonly config: RelayConfig,
    private readonly aiAvailability: AiAvailabilityService,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': this.config.apiKey,
      },
    })

    this.httpClient.interceptors.response.use(
      response => response,
      (error: AxiosError) => Promise.reject(this.normalizeError(error)),
    )
  }

  private normalizeError(error: AxiosError): AxiosError {
    const status = error.response?.status
    const data = error.response?.data as Record<string, unknown> | undefined
    const message = (data?.['message'] as string) || (data?.['error'] as string) || error.message
    error.message = message
    error.name = status ? `RelayApiError(${status})` : 'RelayApiError'
    return error
  }

  /**
   * 提交视频生成任务到上游 relay 服务端
   * 对应上游 POST /ai/video/generations
   */
  async createVideo(request: RelayVideoGenerationRequest): Promise<RelayVideoSubmitResponse> {
    return this.aiAvailability.execute(
      { provider: 'relay', operation: 'createVideo', model: request.model },
      async () => {
        const response: AxiosResponse<RelayCommonResponse<RelayVideoSubmitResponse>> = await this.httpClient.post(
          '/api/ai/video/generations',
          request,
        )
        return response.data.data
      },
    )
  }

  /**
   * 轮询上游 relay 服务端的视频任务状态
   * 对应上游 GET /ai/video/generations/:taskId
   */
  async getVideo(taskId: string): Promise<RelayVideoCallbackDto> {
    return this.aiAvailability.execute(
      { provider: 'relay', operation: 'getVideo' },
      async () => {
        const response: AxiosResponse<RelayCommonResponse<RelayVideoCallbackDto>> = await this.httpClient.get(
          `/api/ai/video/generations/${encodeURIComponent(taskId)}`,
        )
        return response.data.data
      },
    )
  }
}
