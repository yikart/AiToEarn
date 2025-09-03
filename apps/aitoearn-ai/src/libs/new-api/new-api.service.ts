import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AppException, ExceptionCode } from '@/common'
import {
  AdminLogQueryParams,
  ApiResponse,
  CreateTokenRequest,
  LogInfo,
  PaginatedResponse,
  TokenInfo,
  UpdateTokenRequest,
} from './interfaces'
import { NewApiConfig } from './new-api.config'

@Injectable()
export class NewApiService {
  private readonly logger = new Logger(NewApiService.name)
  private readonly httpClient: AxiosInstance

  constructor(private readonly config: NewApiConfig) {
    this.httpClient = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.createHeaders(),
    })

    client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        this.logger.error('Request interceptor error:', error.message)
        return Promise.reject(error)
      },
    )

    client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response received: ${response.status} ${response.statusText}`)
        return response
      },
      (error) => {
        this.logger.error('HTTP request failed:', error.message)
        if (error.response) {
          this.logger.error('Response data:', error.response.data)
          this.logger.error('Response status:', error.response.status)
        }
        throw new AppException(ExceptionCode.NewApiRequestFailed, error.message)
      },
    )

    return client
  }

  private createHeaders(): Record<string, string> {
    return {
      'X-Internal-Service-Token': this.config.internalToken,
      'New-Api-User': this.config.userId.toString(),
      'Content-Type': 'application/json',
    }
  }

  private async request<T = unknown>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
    data?: unknown
    params?: unknown
  }): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.httpClient.request({
        ...options,
      })

      if (!response.data.success) {
        this.logger.error({
          message: `Request failed: ${options.method} ${options.url}`,
          data: response.data,
        })
        throw new AppException(ExceptionCode.NewApiRequestFailed)
      }
      return response.data.data
    }
    catch (error) {
      this.logger.error({
        message: `Request failed: ${options.method} ${options.url}`,
        error,
      })
      throw error
    }
  }

  /**
   * 创建Token
   */
  async createToken(data: CreateTokenRequest): Promise<TokenInfo> {
    return this.request({
      method: 'POST',
      url: '/api/token/',
      data,
    })
  }

  /**
   * 获取Token列表
   */
  async getTokens(
    params?: { p?: number, size?: number, tokenName?: string },
  ): Promise<PaginatedResponse<TokenInfo>> {
    return this.request({
      method: 'GET',
      url: '/api/token/',
      params,
    })
  }

  /**
   * 获取单个Token
   */
  async getToken(tokenId: number): Promise<TokenInfo> {
    return this.request({
      method: 'GET',
      url: `/api/token/${tokenId}`,
    })
  }

  /**
   * 更新Token
   */
  async updateToken(request: UpdateTokenRequest): Promise<TokenInfo> {
    return this.request({
      method: 'PUT',
      url: '/api/token/',
      data: request,
    })
  }

  /**
   * 删除Token
   */
  async deleteToken(tokenId: number): Promise<void> {
    return this.request({
      method: 'DELETE',
      url: `/api/token/${tokenId}`,
    })
  }

  /**
   * 获取日志
   */
  async getLogs(params?: AdminLogQueryParams): Promise<PaginatedResponse<LogInfo>> {
    return this.request({
      method: 'GET',
      url: '/api/log/',
      params,
    })
  }
}
