import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AiAvailabilityService } from '../../../ai-availability'
import { GrokConfig } from './grok.config'
import {
  GrokCreateVideoRequest,
  GrokCreateVideoResponse,
  GrokEditVideoRequest,
  GrokGetVideoStatusResponse,
} from './grok.interface'

@Injectable()
export class GrokLibService {
  private readonly logger = new Logger(GrokLibService.name)
  private readonly httpClient: AxiosInstance

  constructor(
    private readonly config: GrokConfig,
    private readonly aiAvailability: AiAvailabilityService,
  ) {
    this.httpClient = this._createHttpClient()
  }

  private async withAvailability<T>(operation: string, fn: () => Promise<T>, model?: string): Promise<T> {
    return this.aiAvailability.execute(
      { provider: 'grok', operation, model },
      fn,
    )
  }

  private _createHttpClient(): AxiosInstance {
    const baseURL = this.config.proxyUrl
      ? `${this.config.proxyUrl}/${this.config.baseUrl}`
      : this.config.baseUrl

    return axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  async createVideo(request: GrokCreateVideoRequest): Promise<GrokCreateVideoResponse> {
    return this.withAvailability('createVideo', async () => {
      const response: AxiosResponse<GrokCreateVideoResponse> = await this.httpClient.post(
        '/v1/videos/generations',
        request,
      )
      return response.data
    }, request.model)
  }

  async editVideo(request: GrokEditVideoRequest): Promise<GrokCreateVideoResponse> {
    return this.withAvailability('editVideo', async () => {
      this.logger.log({ path: '--------GrokLibService editVideo request----------', request })
      const response: AxiosResponse<GrokCreateVideoResponse> = await this.httpClient.post(
        '/v1/videos/edits',
        request,
      )
      return response.data
    }, request.model)
  }

  async getVideoStatus(requestId: string): Promise<GrokGetVideoStatusResponse> {
    return this.withAvailability('getVideoStatus', async () => {
      const response: AxiosResponse<GrokGetVideoStatusResponse> = await this.httpClient.get(
        `/v1/videos/${requestId}`,
      )
      return response.data
    })
  }
}
