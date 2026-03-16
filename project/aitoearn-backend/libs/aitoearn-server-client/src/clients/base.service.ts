import { Injectable, Logger } from '@nestjs/common'
import { AppException, COMMON_PROPAGATION_HEADERS, CommonResponse, propagationContext } from '@yikart/common'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { AitoearnServerClientConfig } from '../aitoearn-server-client.config'

@Injectable()
export class BaseService {
  protected readonly httpClient: AxiosInstance
  private readonly logger = new Logger(BaseService.name)
  constructor(
    private readonly config: AitoearnServerClientConfig,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.token}`,
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

    const resInterceptor = (response: AxiosResponse) => {
      const res = response.data as CommonResponse<unknown>
      if (res.code !== 0) {
        this.logger.error({ path: response.config.url, ...res })
        throw new AppException(res.code, res.message)
      }
      return response
    }

    this.httpClient.interceptors.response.use(resInterceptor)
  }

  async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    const response: AxiosResponse<CommonResponse<T>> = await this.httpClient(url, config)

    return response.data.data!
  }
}
