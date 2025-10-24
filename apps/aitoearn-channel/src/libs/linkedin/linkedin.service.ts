import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { OAuth2Credential } from '../../core/plat/meta/meta.interfaces'
import { LinkedinOAuth2Config } from './constants'
import { LinkedInShareRequest, LinkedInUploadRequest, LinkedInUploadResponse } from './linkedin.interface'

@Injectable()
export class LinkedinService {
  private readonly logger = new Logger(LinkedinService.name)
  private readonly clientSecret: string = config.oauth.linkedin.clientSecret
  private readonly clientId: string = config.oauth.linkedin.clientId
  private readonly refreshAccessToken: string = LinkedinOAuth2Config.refreshTokenURL
  private readonly apiBaseUrl: string = LinkedinOAuth2Config.apiBaseUrl

  async refreshOAuthCredential(refresh_token: string) {
    const params: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }

    const refreshTokenReqParams = new URLSearchParams(params)
    const tokenResponse: AxiosResponse<OAuth2Credential>
      = await axios.post(this.refreshAccessToken, refreshTokenReqParams)
    return tokenResponse.data
  }

  async initMediaUpload(accessToken: string, req: LinkedInUploadRequest): Promise<LinkedInUploadResponse> {
    const url = `${this.apiBaseUrl}/assets?action=registerUpload`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
    try {
      const response: AxiosResponse<LinkedInUploadResponse> = await axios.post(url, req, config)
      const data = response.data
      this.logger.log(`Init upload response: ${JSON.stringify(data)}`)
      return data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error init upload: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Error init upload: ${error.message}`)
      throw new Error(`Error init upload: ${error.message}`)
    }
  }

  async streamUpload(accessToken: string, src: string, dest: string) {
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/octet-stream',
      },
    }
    this.logger.log(`Upload URL: ${dest}`)
    try {
      const dlStream = await axios.get(src, { responseType: 'stream' })
      const response = await axios.post(
        dest,
        dlStream.data,
        config,
      )
      const data = response.data
      this.logger.log(`Reel upload response: ${JSON.stringify(data)}`)
      return data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error uploading reel: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Error uploading reel: ${error.message}`)
      throw new Error(`Error uploading reel: ${error.message}`)
    }
  }

  async createShare(accessToken: string, req: LinkedInShareRequest) {
    const url = `${this.apiBaseUrl}/ugcPosts`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
    try {
      const response: AxiosResponse = await axios.post(url, req, config)
      if (response.status !== 201) {
        throw new Error(`Unexpected response status: ${response.status}`)
      }
      const shareId: string = response.headers['x-restli-id']
      if (!shareId) {
        throw new Error('Missing x-restli-id header in response')
      }
      this.logger.log(`Create share response: ${JSON.stringify(response.data)}, shareId: ${shareId}`)
      return shareId
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error creating share: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Error creating share: ${error.message}`)
      throw new Error(`Error creating share: ${error.message}`)
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
    }
    try {
      const response: AxiosResponse = await axios.delete(url, config)
      if (response.status !== 204) {
        throw new Error(`Unexpected response status: ${response.status}`)
      }
      this.logger.log(`Delete share response: ${JSON.stringify(response.data)}, shareId: ${shareId}`)
      return shareId
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error deleting share: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Error deleting share: ${error.message}`)
      throw new Error(`Error deleting share: ${error.message}`)
    }
  }
}
