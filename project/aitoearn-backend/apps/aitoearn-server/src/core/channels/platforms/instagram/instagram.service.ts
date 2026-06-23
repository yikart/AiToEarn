import type { AxiosError, AxiosInstance } from 'axios'
import type { InstagramErrorBody } from './instagram.exception'
import type {
  GraphApiResponse,
  InstagramComment,
  InstagramCommentCreateResponse,
  InstagramContentPublishingLimit,
  InstagramGraphQueryInput,
  InstagramInsight,
  InstagramMedia,
  InstagramMediaContainerStatus,
  InstagramPublishedMediaType,
  InstagramUser,
} from './instagram.interface'
import { Injectable } from '@nestjs/common'
import { ResponseCode } from '@yikart/common'
import axios from 'axios'
import { PlatformErrorCategory } from '../platforms.exception'
import { normalizePlatformGraphQuery } from '../platforms.utils'
import { InstagramConfig } from './instagram.config'
import { InstagramPlatformException } from './instagram.exception'
import { InstagramOAuthGrantType } from './instagram.interface'
import { InstagramMediaContainerStatusResponseSchema, InstagramMediaType } from './instagram.schema'

@Injectable()
export class InstagramService {
  private readonly http: AxiosInstance

  constructor(private readonly cfg: InstagramConfig) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<InstagramErrorBody>) => {
        throw InstagramPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private get graphApiBaseUrl(): string {
    return `https://graph.instagram.com/${this.cfg.graphApiVersion}`
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: scopes.join(','),
      state,
      response_type: 'code',
    })

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    expiresAt?: Date
    scope?: string
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: InstagramOAuthGrantType.AuthorizationCode,
      redirect_uri: this.cfg.redirectUri,
      code,
    })

    const response = await this.http.post<{
      access_token: string
      token_type: string
      expires_in?: number
      permissions?: string[] | string
    }>(
      'https://api.instagram.com/oauth/access_token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    const data = response.data
    const shortLivedToken = data.access_token
    const scope = Array.isArray(data.permissions)
      ? data.permissions.join(',')
      : typeof data.permissions === 'string'
        ? data.permissions
        : undefined

    const longLivedToken = await this.extendAccessToken(shortLivedToken)
    return {
      accessToken: longLivedToken.accessToken,
      expiresAt: longLivedToken.expiresAt,
      scope,
    }
  }

  async extendAccessToken(shortLivedToken: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const params = new URLSearchParams({
      grant_type: InstagramOAuthGrantType.ExchangeToken,
      client_secret: this.cfg.clientSecret,
      access_token: shortLivedToken,
    })

    const response = await this.http.get<{
      access_token: string
      expires_in?: number
    }>('https://graph.instagram.com/access_token', { params })

    const data = response.data
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    }
  }

  async refreshAccessToken(accessToken: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const params = new URLSearchParams({
      grant_type: InstagramOAuthGrantType.RefreshToken,
      access_token: accessToken,
    })

    const response = await this.http.get<{
      access_token: string
      expires_in?: number
    }>('https://graph.instagram.com/refresh_access_token', { params })

    const data = response.data
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    await this.http.delete(`${this.graphApiBaseUrl}/me/permissions`, {
      params: { access_token: accessToken },
    })
    return true
  }

  async getInstagramUser(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    username?: string
    accountType?: string
    followersCount?: number
    followsCount?: number
    mediaCount?: number
  }> {
    const response = await this.http.get<InstagramUser>(`${this.graphApiBaseUrl}/me`, {
      params: {
        fields: 'id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
        access_token: accessToken,
      },
    })
    const platformUid = response.data.user_id ?? response.data.id

    return {
      platformUid,
      displayName: response.data.name ?? response.data.username ?? platformUid,
      avatarUrl: response.data.profile_picture_url,
      username: response.data.username,
      accountType: response.data.account_type,
      followersCount: response.data.followers_count,
      followsCount: response.data.follows_count,
      mediaCount: response.data.media_count,
    }
  }

  async getAccountInfo(
    accessToken: string,
    igUserId: string,
    query: InstagramGraphQueryInput = {},
  ): Promise<InstagramUser> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const fields = typeof graphQuery['fields'] === 'string'
      ? graphQuery['fields']
      : 'id,username,followers_count,follows_count,media_count'
    const response = await this.http.get<InstagramUser>(
      `${this.graphApiBaseUrl}/${igUserId}`,
      {
        params: {
          fields,
          ...graphQuery,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }

  async listWorks(
    accessToken: string,
    igUserId: string,
    query: InstagramGraphQueryInput = {},
  ): Promise<GraphApiResponse<InstagramMedia[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const fields = typeof graphQuery['fields'] === 'string'
      ? graphQuery['fields']
      : 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count'
    const response = await this.http.get<GraphApiResponse<InstagramMedia[]>>(
      `${this.graphApiBaseUrl}/${igUserId}/media`,
      {
        params: {
          fields,
          ...graphQuery,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }

  async createMediaContainer(
    accessToken: string,
    igUserId: string,
    params: {
      imageUrl?: string
      videoUrl?: string
      caption?: string
      coverUrl?: string
      isCarouselItem?: boolean
      carouselId?: string
      mediaType?: InstagramMediaType.Image | InstagramMediaType.Reels | InstagramMediaType.Stories
    },
  ): Promise<string> {
    if (params.imageUrl && params.videoUrl) {
      throw InstagramPlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'createMediaContainer' },
      })
    }

    const body = {
      ...(params.imageUrl
        ? {
            image_url: params.imageUrl,
            ...(!params.isCarouselItem ? { media_type: params.mediaType ?? InstagramMediaType.Image } : {}),
          }
        : {}),
      ...(params.videoUrl
        ? {
            video_url: params.videoUrl,
            media_type: params.mediaType ?? InstagramMediaType.Reels,
          }
        : {}),
      ...(params.coverUrl ? { cover_url: params.coverUrl } : {}),
      ...(params.caption && !params.isCarouselItem ? { caption: params.caption } : {}),
      ...(params.isCarouselItem ? { is_carousel_item: 'true' } : {}),
      ...(params.carouselId ? { carousel_id: params.carouselId } : {}),
    }

    const response = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igUserId}/media`,
      null,
      { params: { ...body, access_token: accessToken } },
    )

    return response.data.id
  }

  async createCarouselContainer(
    accessToken: string,
    igUserId: string,
    childrenIds: string[],
    caption?: string,
  ): Promise<string> {
    const params = {
      media_type: InstagramMediaType.Carousel,
      children: childrenIds.join(','),
      access_token: accessToken,
      ...(caption ? { caption } : {}),
    }

    const response = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igUserId}/media`,
      null,
      { params },
    )

    return response.data.id
  }

  async getContentPublishingLimit(
    accessToken: string,
    igUserId: string,
  ): Promise<InstagramContentPublishingLimit> {
    interface ContentPublishingLimitItem {
      quota_usage?: number
      config?: {
        quota_total?: number
        quota_duration?: number
      }
    }
    interface ContentPublishingLimitResponse {
      data?: ContentPublishingLimitItem[]
      quota_usage?: number
      config?: ContentPublishingLimitItem['config']
    }

    const response = await this.http.get<ContentPublishingLimitResponse>(
      `${this.graphApiBaseUrl}/${igUserId}/content_publishing_limit`,
      {
        params: {
          fields: 'config,quota_usage',
          access_token: accessToken,
        },
      },
    )

    const item = Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data

    return {
      quotaUsage: item?.quota_usage,
      quotaTotal: item?.config?.quota_total,
      quotaDuration: item?.config?.quota_duration,
    }
  }

  async getMediaContainerStatus(
    accessToken: string,
    containerId: string,
  ): Promise<InstagramMediaContainerStatus> {
    const response = await this.http.get<{
      status_code: string
      status?: string
    }>(`${this.graphApiBaseUrl}/${containerId}`, {
      params: {
        fields: 'status_code,status',
        access_token: accessToken,
      },
    })

    const data = InstagramMediaContainerStatusResponseSchema.parse(response.data)
    return {
      statusCode: data.status_code,
      status: data.status,
    }
  }

  async publishContainer(
    accessToken: string,
    igUserId: string,
    containerId: string,
  ): Promise<{ id: string }> {
    const response = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken,
        },
      },
    )

    return response.data
  }

  async getMediaInfo(
    accessToken: string,
    mediaId: string,
  ): Promise<{
    id: string
    mediaType: InstagramPublishedMediaType
    permalink?: string
    timestamp?: string
  }> {
    const response = await this.http.get<{
      id: string
      media_type: InstagramPublishedMediaType
      permalink?: string
      timestamp?: string
    }>(`${this.graphApiBaseUrl}/${mediaId}`, {
      params: {
        fields: 'id,media_type,permalink,timestamp',
        access_token: accessToken,
      },
    })

    return {
      id: response.data.id,
      mediaType: response.data.media_type,
      permalink: response.data.permalink,
      timestamp: response.data.timestamp,
    }
  }

  async deleteMedia(
    accessToken: string,
    mediaId: string,
  ): Promise<boolean> {
    await this.http.delete(`${this.graphApiBaseUrl}/${mediaId}`, {
      params: { access_token: accessToken },
    })
    return true
  }

  async listComments(
    accessToken: string,
    mediaId: string,
    params?: { after?: string, before?: string, limit?: number },
  ): Promise<GraphApiResponse<InstagramComment[]>> {
    const response = await this.http.get<GraphApiResponse<InstagramComment[]>>(
      `${this.graphApiBaseUrl}/${mediaId}/comments`,
      {
        params: {
          fields: 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp}',
          limit: params?.limit,
          after: params?.after,
          before: params?.before,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }

  async createComment(
    accessToken: string,
    mediaId: string,
    message: string,
  ): Promise<InstagramCommentCreateResponse> {
    const response = await this.http.post<InstagramCommentCreateResponse>(
      `${this.graphApiBaseUrl}/${mediaId}/comments`,
      null,
      { params: { message, access_token: accessToken } },
    )
    return response.data
  }

  async replyComment(
    accessToken: string,
    commentId: string,
    message: string,
  ): Promise<InstagramCommentCreateResponse> {
    const response = await this.http.post<InstagramCommentCreateResponse>(
      `${this.graphApiBaseUrl}/${commentId}/replies`,
      null,
      { params: { message, access_token: accessToken } },
    )
    return response.data
  }

  async deleteComment(accessToken: string, commentId: string): Promise<void> {
    await this.http.delete(`${this.graphApiBaseUrl}/${commentId}`, {
      params: { access_token: accessToken },
    })
  }

  async getMediaInsights(
    accessToken: string,
    mediaId: string,
    query: InstagramGraphQueryInput = {},
  ): Promise<GraphApiResponse<InstagramInsight[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const metric = typeof graphQuery['metric'] === 'string'
      ? graphQuery['metric']
      : 'reach,likes,comments,shares,saved,total_interactions'
    const response = await this.http.get<GraphApiResponse<InstagramInsight[]>>(
      `${this.graphApiBaseUrl}/${mediaId}/insights`,
      {
        params: {
          metric,
          ...graphQuery,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }

  async getAccountInsights(
    accessToken: string,
    igUserId: string,
    params?: { since?: Date, until?: Date },
  ): Promise<GraphApiResponse<InstagramInsight[]>> {
    const response = await this.http.get<GraphApiResponse<InstagramInsight[]>>(
      `${this.graphApiBaseUrl}/${igUserId}/insights`,
      {
        params: {
          metric: 'reach,profile_views,website_clicks',
          period: 'day',
          since: params?.since?.toISOString(),
          until: params?.until?.toISOString(),
          access_token: accessToken,
        },
      },
    )
    return response.data
  }
}
