import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { VideoConfig } from './video.config'
import {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoTaskStatusRequest,
  VideoTaskStatusResponse,
} from './video.interface'

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)
  private readonly httpClient: AxiosInstance

  constructor(private readonly config: VideoConfig) {
    this.httpClient = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Video API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        this.logger.error('Video API request interceptor error:', error.message)
        return Promise.reject(error)
      },
    )

    client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Video API Response: ${response.status} ${response.statusText}`)
        return response
      },
      (error) => {
        this.logger.error({
          error: error.response.data,
          message: JSON.parse(error.response.data?.message || '{}').error?.message,
        })
        throw new AppException(ResponseCode.AiCallFailed, JSON.parse(error.response.data?.message || '{}').error?.message || error.message)
      },
    )

    return client
  }

  private createHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    return headers
  }

  private async request<T = unknown>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
    data?: unknown
    params?: unknown
    apiKey?: string
  }): Promise<T> {
    const { apiKey, ...requestOptions } = options
    const response: AxiosResponse<T> = await this.httpClient.request({
      ...requestOptions,
      headers: this.createHeaders(apiKey),
    })

    this.logger.debug(response.data)

    return response.data
  }

  /**
   * 提交视频生成任务（通用接口）
   */
  async submitVideoGeneration(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const { apiKey, ...requestData } = request

    const res = await this.request({
      method: 'POST',
      url: '/v1/video/generations',
      data: requestData,
      apiKey,
    })
    return (res as { data: VideoGenerationResponse }).data
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(request: VideoTaskStatusRequest): Promise<VideoTaskStatusResponse> {
    const { taskId, apiKey } = request

    const res = await this.request({
      method: 'GET',
      url: `/v1/video/generations/${taskId}`,
      apiKey,
    })
    return (res as { data: VideoTaskStatusResponse }).data
  }
}
