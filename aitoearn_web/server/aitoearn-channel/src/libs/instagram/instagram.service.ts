import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { MetaOAuthLongLivedCredential } from '@/core/plat/meta/meta.interfaces'
import { InstagramOAuth2Config } from './constants'
import {
  ChunkedMediaUploadRequest,
  CreateMediaContainerRequest,
  CreateMediaContainerResponse,
  InstagramInsightsRequest,
  InstagramInsightsResponse,
  InstagramMediaInsightsRequest,
  InstagramObjectInfo,
  InstagramUserInfoRequest,
  InstagramUserInfoResponse,
} from './instagram.interfaces'

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name)
  private readonly clientSecret: string = config.meta.instagram.clientSecret
  private readonly clientId: string = config.meta.instagram.clientId
  private readonly refreshAccessToken: string = InstagramOAuth2Config.refreshTokenURL
  private readonly apiBaseUrl: string = InstagramOAuth2Config.apiBaseUrl

  async refreshOAuthCredential(refresh_token: string) {
    const lParams: Record<string, string> = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'ig_exchange_token',
      access_token: refresh_token,
    }

    const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
    const llTokenResponse: AxiosResponse<MetaOAuthLongLivedCredential>
      = await axios.get(this.refreshAccessToken, {
        params: longLivedAccessTokenReqParams,
      })
    return llTokenResponse.data
  }

  async createMediaContainer(
    igUserId: string,
    accessToken: string,
    req: CreateMediaContainerRequest,
  ): Promise<CreateMediaContainerResponse> {
    const url = `${this.apiBaseUrl}/v23.0/${igUserId}/media`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const formData = new FormData()
    Object.keys(req).forEach((key) => {
      if (key !== 'children') {
        formData.append(key, req[key]);
      }
    });
    if (req.children) {
      req.children.forEach((child, index) => {
        formData.append(`children[${index}]`, child);
      });
    }
    try {
      const response: AxiosResponse<CreateMediaContainerResponse> = await axios.post(
        url,
        formData,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error response from Instagram API: ${JSON.stringify(error.response.data)}`, error.stack)
      }
      this.logger.error(`Failed to create media container: ${error.message}`, error.stack)
      throw new Error('Failed to create media container')
    }
  }

  async chunkedMediaUploadRequest(
    accessToken: string,
    req: ChunkedMediaUploadRequest,
  ): Promise<CreateMediaContainerResponse> {
    const url = req.upload_uri
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'offset': `${req.offset || 0}`,
        'file_size': `${req.file_size}`,
      },
      data: req.file,
    }
    const response: AxiosResponse<CreateMediaContainerResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<CreateMediaContainerResponse> {
    try {
      const url = `${this.apiBaseUrl}/v23.0/${igUserId}/media_publish`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
      const formData = new FormData()
      formData.append('creation_id', creationId)
      const response: AxiosResponse<CreateMediaContainerResponse> = await axios.post(
        url,
        formData,
        config,
      )
      if (response.status !== 200) {
        this.logger.error(`Failed to publish media container: ${response.data}`)
        throw new Error('Failed to publish media container')
      }
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error response from Instagram API: ${error.response.data}`, error.stack)
      }
      this.logger.error(`Error publishing media container: ${error.message}`, error.stack)
      throw new Error('Error publishing media container')
    }
  }

  async getMetricsForAccount(
    igUserId: string,
    accessToken: string,
    req: InstagramInsightsRequest,
  ) {
    const url = `${this.apiBaseUrl}/${igUserId}/insights`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: req,
    }
    const response: AxiosResponse<any> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async getMediaInsights(
    mediaId: string,
    accessToken: string,
    req: InstagramMediaInsightsRequest,
  ) {
    const url = `${this.apiBaseUrl}/${mediaId}/insights`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: req,
    }
    const response: AxiosResponse<any> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async getObjectInfo(
    accessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<InstagramObjectInfo> {
    const url = `${this.apiBaseUrl}/${objectId}`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    if (fields) {
      config.params = { fields }
    }
    const response: AxiosResponse<InstagramObjectInfo> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async getAccountInsights(
    accessToken: string,
    igUserId: string,
    query: InstagramInsightsRequest,
    requestURL?: string,
  ): Promise<InstagramInsightsResponse> {
    try {
      const url = requestURL || `${this.apiBaseUrl}/${igUserId}/insights`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<InstagramInsightsResponse> = await axios.get(url, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error response from Instagram API: igUserId: ${igUserId}, Error: ${error.response.data}`)
      }
      throw new Error(`Failed to get insights for user ${igUserId}, query: ${JSON.stringify(query)}, Error: ${error.message}`, { cause: error })
    }
  }

  async getAccountInfo(
    userId: string,
    accessToken: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse> {
    const url = `${this.apiBaseUrl}/${userId}`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    const response: AxiosResponse<InstagramUserInfoResponse> = await axios.get(url, config)
    return response.data
  }

  async getUserProfile(
    accessToken: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse> {
    const url = `${this.apiBaseUrl}/me`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    const response: AxiosResponse<InstagramUserInfoResponse> = await axios.get(url, config)
    return response.data
  }
}
