/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-04-14 16:50:44
 * @LastEditors: nevin
 * @Description: TikTok API Service
 */
import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import {
  TiktokCreatorInfo,
  TikTokListVideosParams,
  TikTokListVideosResponse,
  TiktokOAuthResponse,
  TiktokPhotoPublishRequest,
  TiktokPostInfo,
  TiktokPublishResponse,
  TiktokPublishStatusResponse,
  TiktokRevokeResponse,
  TikTokUserInfoResponse,
  TiktokVideoPublishRequest,
  TiktokVideoSourceInfo,
} from './tiktok.interfaces'

@Injectable()
export class TiktokService {
  private readonly logger = new Logger(TiktokService.name)
  private readonly clientSecret: string
  private readonly clientId: string
  private readonly redirectUri: string
  private readonly apiBaseUrl: string = 'https://open.tiktokapis.com/v2'
  private readonly authUrl: string = 'https://www.tiktok.com/v2/auth/authorize'

  constructor() {
    this.clientSecret = config.tiktok.clientSecret
    this.clientId = config.tiktok.clientId
    this.redirectUri = config.tiktok.redirectUri
  }

  /**
   * 通用 API 请求方法
   */
  private async apiRequest<T = unknown>(
    url: string,
    options: AxiosRequestConfig = {},
    accessToken?: string,
  ): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        ...options,
        headers: {
          ...options.headers,
        },
      }

      if (accessToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        }
      }
      const response: AxiosResponse<T> = await axios(url, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`TikTok API request failed: ${url}, status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`)
        const errMsg = error.response.error?.message || `TikTok API request failed: ${url}, status: ${error.response.status}`
        throw new Error(errMsg)
      }
      this.logger.error(`TikTok API request failed: ${url}, error: ${error}`)
      throw new Error(`TikTok API request failed: ${url}, error: ${error}`)
    }
  }

  /**
   * OAuth 相关的请求方法
   */
  private async oauthRequest<T = unknown>(
    url: string,
    data: Record<string, string>,
  ): Promise<T> {
    return this.apiRequest<T>(url, {
      method: 'POST',
      data: new URLSearchParams(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  }

  /**
   * 内容发布相关的请求方法
   */
  private async contentRequest<T = unknown>(
    url: string,
    data: unknown,
    accessToken: string,
  ): Promise<T> {
    const response = await this.apiRequest<{ data: T }>(
      url,
      {
        method: 'POST',
        data,
      },
      accessToken,
    )
    return response.data
  }

  /**
   * 生成授权 URL
   */
  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientId,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state,
    })

    return `${this.authUrl}/?${params.toString()}`
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(code: string): Promise<TiktokOAuthResponse> {
    return this.oauthRequest<TiktokOAuthResponse>(
      `${this.apiBaseUrl}/oauth/token/`,
      {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      },
    )
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<TiktokOAuthResponse> {
    return this.oauthRequest<TiktokOAuthResponse>(
      `${this.apiBaseUrl}/oauth/token/`,
      {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    )
  }

  /**
   * 撤销访问令牌
   */
  async revokeAccessToken(accessToken: string): Promise<TiktokRevokeResponse> {
    return this.oauthRequest<TiktokRevokeResponse>(
      `${this.apiBaseUrl}/oauth/revoke/`,
      {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        token: accessToken,
      },
    )
  }

  async getUserInfo(accessToken: string, fields = ''): Promise<TikTokUserInfoResponse> {
    const userFields = fields || 'open_id,union_id,avatar_url,username,display_name,bio_description'
    return this.apiRequest<TikTokUserInfoResponse>(
      `${this.apiBaseUrl}/user/info/`,
      {
        method: 'GET',
        params: {
          fields: userFields,
        },
      },
      accessToken,
    )
  }

  /**
   * 查询创作者信息
   */
  async getCreatorInfo(accessToken: string): Promise<TiktokCreatorInfo> {
    return this.contentRequest<TiktokCreatorInfo>(
      `${this.apiBaseUrl}/post/publish/creator_info/query/`,
      {},
      accessToken,
    )
  }

  /**
   * 初始化视频发布
   */
  async initVideoPublish(
    accessToken: string,
    publishRequest: TiktokVideoPublishRequest,
  ): Promise<TiktokPublishResponse> {
    return this.contentRequest<TiktokPublishResponse>(
      `${this.apiBaseUrl}/post/publish/inbox/video/init/`,
      publishRequest,
      accessToken,
    )
  }

  /**
   * 初始化照片发布
   */
  async initPhotoPublish(
    accessToken: string,
    publishRequest: TiktokPhotoPublishRequest,
  ): Promise<TiktokPublishResponse> {
    return this.contentRequest<TiktokPublishResponse>(
      `${this.apiBaseUrl}/post/publish/content/init/`,
      publishRequest,
      accessToken,
    )
  }

  /**
   * 查询发布状态
   */
  async getPublishStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TiktokPublishStatusResponse> {
    return this.contentRequest<TiktokPublishStatusResponse>(
      `${this.apiBaseUrl}/post/publish/status/fetch/`,
      { publish_id: publishId },
      accessToken,
    )
  }

  /**
   * 上传视频文件
   */
  async uploadVideoFile(
    uploadUrl: string,
    videoBuffer: Buffer,
    contentType = 'video/mp4',
  ): Promise<void> {
    const fileSize = videoBuffer.length

    await this.apiRequest<void>(uploadUrl, {
      method: 'PUT',
      data: videoBuffer,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      },
    })
  }

  /**
   * 分片上传视频文件
   */
  async chunkedUploadVideoFile(
    uploadUrl: string,
    videoBuffer: Buffer,
    range: [number, number],
    fileSize: number,
    contentType = 'video/mp4',
  ): Promise<void> {
    await this.apiRequest<void>(uploadUrl, {
      method: 'PUT',
      data: videoBuffer,
      headers: {
        'Content-Type': contentType,
        'Content-Length': videoBuffer.length,
        'Content-Range': `bytes ${range[0]}-${range[1]}/${fileSize}`,
      },
    })
  }

  /**
   * 处理视频发布流程
   */
  async handleVideoPublish(
    accessToken: string,
    sourceInfo: TiktokVideoSourceInfo,
    postInfo: TiktokPostInfo,
  ): Promise<TiktokPublishResponse> {
    const publishRequest: TiktokVideoPublishRequest = {
      post_info: postInfo,
      source_info: sourceInfo,
    }

    const result = await this.initVideoPublish(accessToken, publishRequest)

    if (sourceInfo.source === 'FILE_UPLOAD') {
      this.logger.log(`文件上传模式 - 文件大小: ${sourceInfo.video_size}`)
      this.logger.log(`上传 URL: ${result.upload_url}`)
    }
    else {
      this.logger.log(`URL 拉取模式 - 视频 URL: ${sourceInfo.video_url}`)
    }
    return result
  }

  async getUserVideos(
    accessToken: string,
    query?: TikTokListVideosParams,
  ): Promise<TikTokListVideosResponse> {
    const url = `${this.apiBaseUrl}/video/list/`
    const config: AxiosRequestConfig = {
      params: { fields: query?.fields },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
    const resp = await axios.post<TikTokListVideosResponse>(url, {
      cursor: query?.cursor,
      max_count: query?.max_count,
    }, config)
    return resp.data
  }
}
