import { Logger } from '@nestjs/common'
import { AppException } from '@yikart/common'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config'

export class InternalApi {
  readonly logger = new Logger(InternalApi.name)
  private readonly httpCli: AxiosInstance
  constructor() {
    this.httpCli = axios.create({
      baseURL: config.gateway,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  }

  async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    this.logger.debug(`Internal API Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<T> = await this.httpCli(url, config)
      this.logger.debug(`Internal API Response <- ${url} status=${response.status} data=${JSON.stringify(response.data)}`)
      return response.data
    }
    catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data
        this.logger.error(`Internal API Axios Error url=${url} status=${status} data=${JSON.stringify(data)}`)
        throw new AppException(status || 500, `Internal API Request Failed: ${url}`)
      }
      this.logger.error(`Internal API Failed: error=${error}`)
      throw new AppException(500, `Internal API Request Failed: ${url}`)
    }
  }
}
