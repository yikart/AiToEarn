import type { AxiosError, AxiosInstance } from 'axios'
import type { PinterestErrorBody } from './pinterest.exception'
import type {
  PinterestBoard,
  PinterestCreatePinBody,
  PinterestCreatePinParams,
  PinterestListPinsParams,
  PinterestMediaStatus,
  PinterestMediaUpload,
  PinterestPin,
  PinterestPinAnalyticsResponse,
  PinterestPinMediaSource,
  PinterestTokenResponse,
  PinterestUpdatePinBody,
  PinterestUpdatePinParams,
  PinterestUser,
} from './pinterest.interface'
import type { PinterestBoardCreate } from './pinterest.schema'
import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { PinterestConfig } from './pinterest.config'
import { PinterestPlatformException } from './pinterest.exception'
import {
  PinterestAnalyticsMetricType,
  PinterestMediaType,
  PinterestOAuthGrantType,
  PinterestPinMediaSourceType,
} from './pinterest.interface'

@Injectable()
export class PinterestService {
  private readonly http: AxiosInstance
  private readonly apiBaseUrl: string

  constructor(private readonly cfg: PinterestConfig) {
    this.apiBaseUrl = this.normalizeApiBaseUrl(cfg.baseUrl)
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<PinterestErrorBody>) => {
        throw PinterestPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private normalizeApiBaseUrl(baseUrl: string): string {
    const trimmed = (baseUrl || 'https://api.pinterest.com').replace(/\/+$/, '')
    return trimmed.endsWith('/v5') ? trimmed : `${trimmed}/v5`
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: scopes.join(','),
      state,
      response_type: 'code',
    })

    return `https://www.pinterest.com/oauth/?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const credentials = Buffer.from(
      `${this.cfg.clientId}:${this.cfg.clientSecret}`,
    ).toString('base64')

    const response = await this.http.post<PinterestTokenResponse>(
      `${this.apiBaseUrl}/oauth/token`,
      new URLSearchParams({
        grant_type: PinterestOAuthGrantType.AuthorizationCode,
        code,
        redirect_uri: this.cfg.redirectUri,
        continuous_refresh: 'true',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
      },
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const credentials = Buffer.from(
      `${this.cfg.clientId}:${this.cfg.clientSecret}`,
    ).toString('base64')

    const response = await this.http.post<PinterestTokenResponse>(
      `${this.apiBaseUrl}/oauth/token`,
      new URLSearchParams({
        grant_type: PinterestOAuthGrantType.RefreshToken,
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
      },
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    const credentials = Buffer.from(
      `${this.cfg.clientId}:${this.cfg.clientSecret}`,
    ).toString('base64')

    await this.http.post(
      `${this.apiBaseUrl}/oauth/revoke`,
      new URLSearchParams({
        token: accessToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
      },
    )

    return true
  }

  async getUser(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    username?: string
    followerCount: number
    followingCount: number
    monthlyViews: number
    pinCount: number
  }> {
    const response = await this.http.get<PinterestUser>(
      `${this.apiBaseUrl}/user_account`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    const user = response.data

    return {
      platformUid: user.id,
      displayName: user.business_name ?? user.username,
      avatarUrl: user.profile_image,
      username: user.username,
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      monthlyViews: user.monthly_views ?? 0,
      pinCount: user.pin_count ?? 0,
    }
  }

  async listBoards(accessToken: string): Promise<PinterestBoard[]> {
    const boards: PinterestBoard[] = []
    let bookmark: string | undefined

    do {
      const params: Record<string, string> = {
        page_size: '25',
        fields: 'id,name,description,privacy',
      }
      if (bookmark) {
        params['bookmark'] = bookmark
      }

      const response = await this.http.get<{
        items: PinterestBoard[]
        bookmark?: string
      }>(`${this.apiBaseUrl}/boards`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      })

      boards.push(...response.data.items)
      bookmark = response.data.bookmark
    } while (bookmark)

    return boards
  }

  async createPin(
    accessToken: string,
    params: PinterestCreatePinParams,
  ): Promise<PinterestPin> {
    let mediaSource: PinterestPinMediaSource | undefined
    if (params.imageUrl) {
      mediaSource = {
        source_type: PinterestPinMediaSourceType.ImageUrl,
        url: params.imageUrl,
      }
    }
    else if (params.imageBase64) {
      mediaSource = {
        source_type: PinterestPinMediaSourceType.ImageBase64,
        content_type: 'image/jpeg',
        data: params.imageBase64,
      }
    }
    else if (params.videoUrl) {
      mediaSource = {
        source_type: PinterestPinMediaSourceType.VideoUrl,
        url: params.videoUrl,
      }
    }
    else if (params.videoMediaId) {
      mediaSource = {
        source_type: PinterestPinMediaSourceType.VideoId,
        media_id: params.videoMediaId,
        cover_image_url: params.coverImageUrl,
      }
    }

    const body: PinterestCreatePinBody = {
      board_id: params.boardId,
      ...(params.title ? { title: params.title } : {}),
      ...(params.description ? { description: params.description } : {}),
      ...(params.link ? { link: params.link } : {}),
      ...(params.altText ? { alt_text: params.altText } : {}),
      ...(mediaSource ? { media_source: mediaSource } : {}),
    }

    const response = await this.http.post<PinterestPin>(
      `${this.apiBaseUrl}/pins`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return response.data
  }

  async createVideoMediaUpload(accessToken: string): Promise<PinterestMediaUpload> {
    const response = await this.http.post<PinterestMediaUpload>(
      `${this.apiBaseUrl}/media`,
      { media_type: PinterestMediaType.Video },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return response.data
  }

  async uploadVideoMedia(upload: PinterestMediaUpload, video: Buffer): Promise<void> {
    const formData = new FormData()
    for (const [key, value] of Object.entries(upload.upload_parameters)) {
      formData.append(key, value)
    }
    formData.append('file', new Blob([new Uint8Array(video)]), 'video.mp4')

    await this.http.post(upload.upload_url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async getMediaStatus(accessToken: string, mediaId: string): Promise<PinterestMediaStatus> {
    const response = await this.http.get<PinterestMediaStatus>(
      `${this.apiBaseUrl}/media/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    return response.data
  }

  async getPin(
    accessToken: string,
    pinId: string,
  ): Promise<PinterestPin> {
    const response = await this.http.get<PinterestPin>(
      `${this.apiBaseUrl}/pins/${pinId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    return response.data
  }

  async listPins(
    accessToken: string,
    params?: PinterestListPinsParams,
  ): Promise<{ list: PinterestPin[], count: number, bookmark?: string }> {
    const response = await this.http.get<{
      items?: PinterestPin[]
      bookmark?: string
    }>(
      `${this.apiBaseUrl}/pins`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          bookmark: params?.bookmark,
          page_size: params?.pageSize,
        },
      },
    )

    const list = response.data.items ?? []
    return {
      list,
      count: list.length,
      bookmark: response.data.bookmark,
    }
  }

  async updatePin(
    accessToken: string,
    pinId: string,
    params: PinterestUpdatePinParams,
  ): Promise<PinterestPin> {
    const body: PinterestUpdatePinBody = {
      title: params.title,
      description: params.description,
      link: params.link,
      board_id: params.boardId,
    }

    const response = await this.http.patch<PinterestPin>(
      `${this.apiBaseUrl}/pins/${pinId}`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return response.data
  }

  async deletePin(accessToken: string, pinId: string): Promise<boolean> {
    await this.http.delete(`${this.apiBaseUrl}/pins/${pinId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return true
  }

  async createBoard(
    accessToken: string,
    params: PinterestBoardCreate,
  ): Promise<PinterestBoard> {
    const response = await this.http.post<PinterestBoard>(
      `${this.apiBaseUrl}/boards`,
      params,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    return response.data
  }

  async updateBoard(
    accessToken: string,
    boardId: string,
    params: { name?: string, description?: string, privacy?: string },
  ): Promise<PinterestBoard> {
    const response = await this.http.patch<PinterestBoard>(
      `${this.apiBaseUrl}/boards/${boardId}`,
      params,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    return response.data
  }

  async deleteBoard(accessToken: string, boardId: string): Promise<void> {
    await this.http.delete(`${this.apiBaseUrl}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }

  async getPinAnalytics(
    accessToken: string,
    pinId: string,
    range: { since: Date, until: Date },
  ): Promise<PinterestPinAnalyticsResponse> {
    const response = await this.http.get<PinterestPinAnalyticsResponse>(
      `${this.apiBaseUrl}/pins/${pinId}/analytics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: this.toPinterestDate(range.since),
          end_date: this.toPinterestDate(range.until),
          metric_types: [
            PinterestAnalyticsMetricType.Impression,
            PinterestAnalyticsMetricType.Save,
            PinterestAnalyticsMetricType.PinClick,
            PinterestAnalyticsMetricType.OutboundClick,
            PinterestAnalyticsMetricType.VideoMrcView,
          ].join(','),
        },
      },
    )
    return response.data
  }

  private toPinterestDate(date: Date): string {
    return date.toISOString().slice(0, 10)
  }
}
