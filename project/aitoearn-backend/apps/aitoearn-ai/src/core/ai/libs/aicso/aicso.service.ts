import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AicsoConfig } from './aicso.config'
import {
  AicsoCreateVideoRequest,
  AicsoCreateVideoResponse,
  AicsoQueryResponse,
} from './aicso.interface'

@Injectable()
export class AicsoLibService {
  private readonly logger = new Logger(AicsoLibService.name)
  private readonly httpClient: AxiosInstance

  constructor(
    private readonly config: AicsoConfig,
  ) {
    this.httpClient = this._createHttpClient()
  }

  private _createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })
  }

  async createVideo(request: AicsoCreateVideoRequest): Promise<AicsoCreateVideoResponse> {
    const response: AxiosResponse<AicsoCreateVideoResponse> = await this.httpClient.post(
      '/v1/video/create',
      request,
    )
    return response.data
  }

  async getVideoStatus(taskId: string): Promise<AicsoQueryResponse> {
    const response: AxiosResponse<AicsoQueryResponse> = await this.httpClient.get(
      '/v1/video/query',
      { params: { id: taskId } },
    )
    return response.data
  }
}
