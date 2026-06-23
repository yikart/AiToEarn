import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { AiAvailabilityService } from '../../../ai-availability'
import { RelayConfig } from './relay.config'
import { RelayVideoCallbackDto, RelayVideoGenerationRequest, RelayVideoSubmitResponse } from './relay.interface'

interface RelayCommonResponse<T> {
  code?: number
  message?: string
  data?: T
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
      response => this.normalizeResponse(response),
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

  private normalizeResponse<T>(response: AxiosResponse<RelayCommonResponse<T> | T>): AxiosResponse<T> {
    response.data = this.unwrapResponse(response.data)
    return response as AxiosResponse<T>
  }

  private unwrapResponse<T>(body: RelayCommonResponse<T> | T): T {
    if (!this.isCommonResponse(body)) {
      return body as T
    }

    if (body.code != null && body.code !== ResponseCode.Success) {
      throw new AppException(body.code, body.message ?? 'Relay API request failed')
    }

    return body.data as T
  }

  private isCommonResponse<T>(body: RelayCommonResponse<T> | T): body is RelayCommonResponse<T> {
    return typeof body === 'object'
      && body !== null
      && 'data' in body
  }

  private stringifyForError(value: unknown): string {
    try {
      return JSON.stringify(value)
    }
    catch {
      return String(value)
    }
  }

  /**
   * 提交视频生成任务到上游 relay 服务端
   * 对应上游 POST /ai/video/generations
   */
  async createVideo(request: RelayVideoGenerationRequest): Promise<RelayVideoSubmitResponse> {
    return this.aiAvailability.execute(
      { provider: 'relay', operation: 'createVideo', model: request.model },
      async () => {
        const response: AxiosResponse<RelayVideoSubmitResponse> = await this.httpClient.post(
          '/api/ai/video/generations',
          request,
        )
        const result = response.data
        if (!result?.id) {
          throw new AppException(ResponseCode.AiCallFailed, { error: `Relay video task id is missing: ${this.stringifyForError(result)}` })
        }
        return result
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
        const response: AxiosResponse<RelayVideoCallbackDto> = await this.httpClient.get(
          `/api/ai/video/generations/${encodeURIComponent(taskId)}`,
        )
        return response.data
      },
    )
  }
}
