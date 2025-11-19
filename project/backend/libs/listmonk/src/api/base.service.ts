import { Inject, Injectable } from '@nestjs/common'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ListmonkConfig } from '../interfaces'

interface ListmonkResponse<T> {
  data: T
}

@Injectable()
export class BaseService {
  protected readonly httpClient: AxiosInstance
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
    const response: AxiosResponse<ListmonkResponse<T>> = await this.httpClient(url, config)

    return response.data.data
  }
}
