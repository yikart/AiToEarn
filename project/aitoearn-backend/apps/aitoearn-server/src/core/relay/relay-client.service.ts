import { Injectable, Logger } from '@nestjs/common'
import { AppException, CommonResponse, ResponseCode } from '@yikart/common'
import axios, { AxiosRequestConfig } from 'axios'
import { config } from '../../config'

@Injectable()
export class RelayClientService {
  private readonly logger = new Logger(RelayClientService.name)

  get enabled() {
    return !!config.relay
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', url: path, params })
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', url: path, data })
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', url: path, data })
  }

  async delete<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: path, data })
  }

  private async request<T>(options: AxiosRequestConfig): Promise<T> {
    if (!config.relay) {
      throw new AppException(ResponseCode.RelayServerUnavailable)
    }

    try {
      const response = await axios<CommonResponse<T>>({
        ...options,
        url: `${config.relay.serverUrl}${options.url}`,
        headers: {
          ...options.headers,
          'x-api-key': config.relay.apiKey,
        },
      })
      return response.data.data as T
    }
    catch (error) {
      this.logger.error({ message: 'Relay request failed', url: options.url, error })
      throw new AppException(ResponseCode.RelayServerUnavailable)
    }
  }
}
