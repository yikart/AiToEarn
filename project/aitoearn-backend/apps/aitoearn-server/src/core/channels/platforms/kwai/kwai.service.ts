import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import type { Readable } from 'node:stream'
import type { GenerateAuthUrlInput } from '../platforms.interface'
import type { KwaiPlatformResponseBody } from './kwai.exception'
import type {
  KwaiApiResponse,
  KwaiOAuthCredentialsResponse,
  KwaiPhotoInfo,
  KwaiPhotoListResponse,
  KwaiPublishVideoResponse,
  KwaiStartUploadResponse,
  KwaiUserInfoResponse,
  KwaiVideoUploadResponse,
} from './kwai.interface'
import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { KwaiConfig } from './kwai.config'
import { KwaiOAuthGrantType } from './kwai.constants'
import { KwaiPlatformException } from './kwai.exception'

const KWAI_API_HOST = 'https://open.kuaishou.com'

@Injectable()
export class KwaiService {
  private readonly http: AxiosInstance

  constructor(private readonly cfg: KwaiConfig) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      (response) => {
        if (KwaiPlatformException.hasPlatformError(response)) {
          throw KwaiPlatformException.fromPlatformResponse(response)
        }
        return response
      },
      (error: AxiosError<KwaiPlatformResponseBody>) => {
        throw KwaiPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private async request<T>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<KwaiApiResponse<T>> {
    const response = await this.http.request<KwaiApiResponse<T>>({
      ...config,
      method: config.method ?? 'GET',
      url,
    })
    return response.data
  }

  generateAuthUrl(
    scopes: string[],
    state: string,
    deviceType?: GenerateAuthUrlInput['deviceType'],
  ): string {
    const params = new URLSearchParams({
      app_id: this.cfg.clientId,
      scope: scopes.join(','),
      response_type: 'code',
      state,
      redirect_uri: this.cfg.redirectUri,
      ...(deviceType === 'desktop' ? { ua: 'pc' } : {}),
    })

    return `${KWAI_API_HOST}/oauth2/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    scope: string
    openId: string
  }> {
    const params = {
      app_id: this.cfg.clientId,
      app_secret: this.cfg.clientSecret,
      code,
      grant_type: KwaiOAuthGrantType.AuthorizationCode,
    }

    const url = `${KWAI_API_HOST}/oauth2/access_token`
    const data = await this.request<KwaiOAuthCredentialsResponse>(
      url,
      { method: 'GET', params },
    )

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scopes.join(','),
      openId: data.open_id,
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    scope: string
  }> {
    const params = {
      app_id: this.cfg.clientId,
      app_secret: this.cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: KwaiOAuthGrantType.RefreshToken,
    }

    const url = `${KWAI_API_HOST}/oauth2/refresh_token`
    const data = await this.request<KwaiOAuthCredentialsResponse>(
      url,
      { params },
    )

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scopes.join(','),
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    displayName: string
    avatarUrl?: string
    sex?: string
    fanCount?: number
    followCount?: number
    city?: string
  }> {
    const params = {
      app_id: this.cfg.clientId,
      access_token: accessToken,
    }

    const url = `${KWAI_API_HOST}/openapi/user_info`
    const data = await this.request<KwaiUserInfoResponse>(
      url,
      { params },
    )

    const userInfo = data.user_info
    return {
      displayName: userInfo.name,
      avatarUrl: userInfo.bigHead || userInfo.head,
      sex: userInfo.sex,
      fanCount: userInfo.fan,
      followCount: userInfo.follow,
      city: userInfo.city,
    }
  }

  async listPhotos(
    accessToken: string,
    cursor?: string,
    count?: number,
  ): Promise<KwaiPhotoInfo[]> {
    const page = await this.listPhotoPage(accessToken, cursor, count)
    return page.items
  }

  async listPhotoPage(
    accessToken: string,
    cursor?: string,
    count?: number,
  ): Promise<{
    items: KwaiPhotoInfo[]
    rawResponse: KwaiPhotoListResponse
  }> {
    const params = {
      app_id: this.cfg.clientId,
      access_token: accessToken,
      cursor,
      count,
    }

    const url = `${KWAI_API_HOST}/openapi/photo/list`
    const data = await this.request<KwaiPhotoListResponse>(
      url,
      { params },
    )

    return {
      items: data.video_list ?? [],
      rawResponse: data,
    }
  }

  async startUpload(accessToken: string): Promise<{
    uploadToken: string
    endpoint: string
  }> {
    const params = {
      app_id: this.cfg.clientId,
      access_token: accessToken,
    }

    const url = `${KWAI_API_HOST}/openapi/photo/start_upload`
    const data = await this.request<KwaiStartUploadResponse>(
      url,
      { method: 'POST', params },
    )

    return {
      uploadToken: data.upload_token,
      endpoint: data.endpoint,
    }
  }

  async fragmentUploadVideo(
    uploadToken: string,
    fragmentId: number,
    endpoint: string,
    video: Buffer | Readable,
    contentLength?: number,
  ): Promise<void> {
    const params = {
      fragment_id: fragmentId,
      upload_token: uploadToken,
    }
    const headers: Record<string, string> = { 'Content-Type': 'video/mp4' }
    if (contentLength !== undefined) {
      headers['Content-Length'] = String(contentLength)
    }

    const url = `http://${endpoint}/api/upload/fragment`
    await this.request<KwaiVideoUploadResponse>(
      url,
      {
        method: 'POST',
        params,
        headers,
        data: video,
      },
    )
  }

  async completeFragmentUpload(
    uploadToken: string,
    fragmentCount: number,
    endpoint: string,
  ): Promise<void> {
    const params = {
      fragment_count: fragmentCount,
      upload_token: uploadToken,
    }

    const url = `http://${endpoint}/api/upload/complete`
    await this.request<KwaiVideoUploadResponse>(
      url,
      { method: 'POST', params },
    )
  }

  async publishVideo(
    accessToken: string,
    caption: string,
    cover: Blob,
    uploadToken: string,
    option?: {
      stereo_type?: string
      merchant_product_id?: string
    },
  ): Promise<{ photoId: string, playUrl?: string }> {
    const formData = new FormData()
    formData.append('caption', caption)
    formData.append('cover', cover)

    const params = {
      upload_token: uploadToken,
      app_id: this.cfg.clientId,
      access_token: accessToken,
      stereo_type: option?.stereo_type,
      merchant_product_id: option?.merchant_product_id,
    }

    const url = `${KWAI_API_HOST}/openapi/photo/publish`
    const data = await this.request<KwaiPublishVideoResponse>(
      url,
      {
        method: 'POST',
        params,
        data: formData,
      },
    )

    return {
      photoId: data.video_info.photo_id,
      playUrl: data.video_info.play_url,
    }
  }

  async getVideoInfo(
    accessToken: string,
    photoId: string,
  ): Promise<{
    photoId: string
    caption: string
    cover: string
    playUrl: string
    createTime: number
    likeCount: number
    commentCount: number
    viewCount: number
    pending: boolean
  }> {
    const params = {
      app_id: this.cfg.clientId,
      access_token: accessToken,
      photo_id: photoId,
    }

    const url = `${KWAI_API_HOST}/openapi/photo/info`
    const data = await this.request<{ video_info: KwaiPublishVideoResponse['video_info'] }>(
      url,
      { params },
    )

    const video = data.video_info
    return {
      photoId: video.photo_id,
      caption: video.caption,
      cover: video.cover,
      playUrl: video.play_url ?? '',
      createTime: video.create_time,
      likeCount: video.like_count,
      commentCount: video.comment_count,
      viewCount: video.view_count,
      pending: video.pending,
    }
  }
}
