import { Inject, Injectable, Logger } from '@nestjs/common'
import { COMMON_PROPAGATION_HEADERS, propagationContext } from '@yikart/common'
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

    this.httpClient.interceptors.request.use((request) => {
      const store = propagationContext.getStore()
      if (store == null)
        return request
      COMMON_PROPAGATION_HEADERS
        .forEach((key) => {
          const value = store.headers[key]
          if (value) {
            request.headers.set(key, value)
          }
        })
      return request
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
