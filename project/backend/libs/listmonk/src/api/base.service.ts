import { Inject, Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ListmonkConfig } from '../interfaces'

interface ListmonkResponse<T> {
  data: T
}

@Injectable()
export class BaseService {
  protected readonly httpClient: AxiosInstance
  private readonly logger = new Logger(BaseService.name)
  constructor(
    @Inject('LISTMONK_CONFIG') private readonly config: ListmonkConfig,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.host,
      timeout: 30000,
      auth: {
        username: this.config.apiKey,
        password: this.config.apiSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    try {
      const response: AxiosResponse<ListmonkResponse<T>> = await this.httpClient(url, config)
      return response.data.data
    }
    catch (error: any) {
      this.logger.error({
        url,
        config,
        error: error.response?.data || 'listmonk err',
        status: error.response?.status || 400,
      })
      throw error
    }
  }
}
