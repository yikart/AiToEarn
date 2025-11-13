import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { OAuth2Credential } from '../../core/platforms/meta/meta.interfaces'
import { LinkedinOAuth2Config } from './constants'
import { LinkedInError } from './linkedin.exception'
import { LinkedInShareRequest, LinkedInUploadRequest, LinkedInUploadResponse } from './linkedin.interface'

@Injectable()
export class LinkedinService {
  private readonly logger = new Logger(LinkedinService.name)
  private readonly clientSecret: string = config.oauth.linkedin.clientSecret
  private readonly clientId: string = config.oauth.linkedin.clientId
  private readonly refreshAccessToken: string = LinkedinOAuth2Config.refreshTokenURL
  private readonly apiBaseUrl: string = LinkedinOAuth2Config.apiBaseUrl

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    const operation = options.operation || 'LinkedIn request'
    this.logger.debug(`[LinkedIn:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(`[LinkedIn:${operation}] Response <- ${url} status=${response.status} data=${JSON.stringify(response.data)}`)
      return response.data
    }
    catch (error: unknown) {
      const err = LinkedInError.buildFromError(error, operation)
      this.logger.error(`[LinkedIn:${operation}] Error !! ${url} message=${err.message} status=${err.status} rawError=${JSON.stringify(err.rawError)}`)
      throw err
    }
  }

  async refreshOAuthCredential(refresh_token: string) {
    const params: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: new URLSearchParams(params),
      method: 'POST',
    }
    return this.request<OAuth2Credential>(
      this.refreshAccessToken,
      config,
      { operation: 'refreshOAuthCredential' },
    )
  }

  async initMediaUpload(accessToken: string, req: LinkedInUploadRequest): Promise<LinkedInUploadResponse> {
    const url = `${this.apiBaseUrl}/assets?action=registerUpload`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      method: 'POST',
      data: req,
    }
    return this.request<LinkedInUploadResponse>(
      url,
      config,
      { operation: 'initMediaUpload' },
    )
  }

  async streamUpload(accessToken: string, src: string, dest: string) {
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/octet-stream',
      },
      method: 'POST',
    }
    const dlStream = await axios.get(src, { responseType: 'stream' })
    config.data = dlStream.data
    return this.request<void>(
      dest,
      config,
      { operation: 'streamUpload' },
    )
  }

  async createShare(accessToken: string, req: LinkedInShareRequest) {
    const url = `${this.apiBaseUrl}/ugcPosts`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      method: 'POST',
      data: req,
    }
    try {
      const response = await axios.post(url, req, config)
      const shareId: string = response.headers['x-restli-id']
      if (!shareId) {
        throw LinkedInError.buildFromResponse(
          response,
          'createShare',
        )
      }
      this.logger.log(`Create share response: ${JSON.stringify(response.data)}, shareId: ${shareId}`)
      return shareId
    }
    catch (error) {
      throw LinkedInError.buildFromError(
        error,
        'createShare',
        { url, method: 'POST' },
      )
    }
  }

  async deletePost(shareId: string, accessToken: string) {
    const url = `${this.apiBaseUrl}/ugcPosts/${encodeURIComponent(shareId)}`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      method: 'DELETE',
    }
    return this.request<void>(
      url,
      config,
      { operation: 'deletePost' },
    )
  }
}
