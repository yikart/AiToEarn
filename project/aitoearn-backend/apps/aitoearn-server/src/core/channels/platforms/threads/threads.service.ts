import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ThreadsErrorBody } from './threads.exception'
import type {
  ThreadsContainerResponse,
  ThreadsContainerStatusResponse,
  ThreadsCreateContainerInput,
  ThreadsGraphQueryInput,
  ThreadsInsightsResponse,
  ThreadsLocation,
  ThreadsLocationSearchResponse,
  ThreadsLongLivedTokenResponse,
  ThreadsManageReplyResponse,
  ThreadsMediaChildrenResponse,
  ThreadsOAuthTokenResponse,
  ThreadsPostListResponse,
  ThreadsPublishedPost,
  ThreadsPublishResponse,
  ThreadsReplyListResponse,
  ThreadsUserProfile,
} from './threads.interface'
import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { normalizePlatformGraphQuery } from '../platforms.utils'
import { ThreadsConfig } from './threads.config'
import { ThreadsPlatformException } from './threads.exception'
import { ThreadsOAuthGrantType } from './threads.interface'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)
  private readonly apiBaseUrl = 'https://graph.threads.net'

  constructor(private readonly cfg: ThreadsConfig) {}

  private async request<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    this.logger.debug(`[Threads] ${config.method ?? 'GET'} ${url}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      return response.data
    }
    catch (error) {
      if (axios.isAxiosError<ThreadsErrorBody>(error)) {
        throw ThreadsPlatformException.fromAxiosError(error)
      }
      throw error
    }
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state,
    })

    return `https://threads.net/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    expiresAt?: Date
    scope?: string
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      grant_type: ThreadsOAuthGrantType.AuthorizationCode,
      redirect_uri: this.cfg.redirectUri,
      code,
    })

    const data = await this.request<ThreadsOAuthTokenResponse>(
      'https://graph.threads.net/oauth/access_token',
      {
        method: 'POST',
        data: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const data = await this.request<ThreadsLongLivedTokenResponse>(
      'https://graph.threads.net/access_token',
      {
        method: 'GET',
        params: {
          grant_type: ThreadsOAuthGrantType.ExchangeToken,
          client_secret: this.cfg.clientSecret,
          access_token: shortLivedToken,
        },
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async refreshAccessToken(accessToken: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const data = await this.request<ThreadsLongLivedTokenResponse>(
      'https://graph.threads.net/refresh_access_token',
      {
        method: 'GET',
        params: {
          grant_type: ThreadsOAuthGrantType.RefreshToken,
          access_token: accessToken,
        },
      },
    )

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  async getUserProfile(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    username: string
    avatarUrl?: string
    biography?: string
  }> {
    const data = await this.request<ThreadsUserProfile>(
      `${this.apiBaseUrl}/me`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields: 'id,username,name,threads_profile_picture_url,threads_biography',
        },
      },
    )

    return {
      platformUid: data.id,
      displayName: data.name,
      username: data.username,
      avatarUrl: data.threads_profile_picture_url,
      biography: data.threads_biography,
    }
  }

  async listWorks(
    userId: string,
    accessToken: string,
    query: ThreadsGraphQueryInput = {},
  ): Promise<ThreadsPostListResponse> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const fields = typeof graphQuery['fields'] === 'string'
      ? graphQuery['fields']
      : 'id,media_type,media_url,permalink,owner,text,timestamp,shortcode,thumbnail_url,username'
    return this.request<ThreadsPostListResponse>(
      `${this.apiBaseUrl}/${userId}/threads`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields,
          ...graphQuery,
        },
      },
    )
  }

  async getFollowerCount(
    userId: string,
    accessToken: string,
  ): Promise<number | undefined> {
    const data = await this.request<ThreadsInsightsResponse>(
      `${this.apiBaseUrl}/${userId}/threads_insights`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { metric: 'followers_count' },
      },
    )
    const metric = data.data?.find(item => item.name === 'followers_count')
    const lastValue = metric?.values?.at(-1)?.value
    return metric?.total_value?.value ?? lastValue
  }

  async searchLocations(
    accessToken: string,
    params: {
      keyword?: string
      latitude?: number
      longitude?: number
    },
  ): Promise<ThreadsLocation[]> {
    const data = await this.request<ThreadsLocationSearchResponse>(
      `${this.apiBaseUrl}/location_search`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: params.keyword,
          latitude: params.latitude,
          longitude: params.longitude,
          fields: 'id,address,city,country,name,latitude,longitude,postal_code',
        },
      },
    )

    return data.data ?? []
  }

  async createContainer(
    userId: string,
    accessToken: string,
    params: ThreadsCreateContainerInput,
  ): Promise<ThreadsContainerResponse> {
    const formData = new FormData()
    formData.append('media_type', params.mediaType)

    if (params.text !== undefined) {
      formData.append('text', params.text)
    }
    if (params.imageUrl) {
      formData.append('image_url', params.imageUrl)
    }
    if (params.videoUrl) {
      formData.append('video_url', params.videoUrl)
    }
    if (params.children) {
      formData.append('children', params.children)
    }
    if (params.isCarouselItem) {
      formData.append('is_carousel_item', 'true')
    }
    if (params.topicTag) {
      formData.append('topic_tag', params.topicTag)
    }
    if (params.locationId) {
      formData.append('location_id', params.locationId)
    }
    if (params.replyToId) {
      formData.append('reply_to_id', params.replyToId)
    }
    if (params.replyControl) {
      formData.append('reply_control', params.replyControl)
    }
    if (params.allowlistedCountryCodes?.length) {
      formData.append('allowlisted_country_codes', params.allowlistedCountryCodes.join(','))
    }
    if (params.altText) {
      formData.append('alt_text', params.altText)
    }
    if (params.linkAttachmentUrl) {
      formData.append('link_attachment', params.linkAttachmentUrl)
    }
    if (params.quotePostId) {
      formData.append('quote_post_id', params.quotePostId)
    }
    if (params.autoPublishText !== undefined) {
      formData.append('auto_publish_text', String(params.autoPublishText))
    }

    return this.request<ThreadsContainerResponse>(
      `${this.apiBaseUrl}/${userId}/threads`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        data: formData,
      },
    )
  }

  async publishContainer(
    userId: string,
    accessToken: string,
    creationId: string,
  ): Promise<ThreadsPublishResponse> {
    return this.request<ThreadsPublishResponse>(
      `${this.apiBaseUrl}/${userId}/threads_publish`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { creation_id: creationId },
      },
    )
  }

  async getContainerStatus(
    containerId: string,
    accessToken: string,
  ): Promise<ThreadsContainerStatusResponse> {
    return this.request<ThreadsContainerStatusResponse>(
      `${this.apiBaseUrl}/${containerId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'id,status' },
      },
    )
  }

  async getPublishedPost(
    postId: string,
    accessToken: string,
    fields = 'id,status,permalink,text,timestamp,username',
  ): Promise<ThreadsPublishedPost> {
    return this.request<ThreadsPublishedPost>(
      `${this.apiBaseUrl}/${postId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields },
      },
    )
  }

  async getContainerChildren(
    containerId: string,
    accessToken: string,
  ): Promise<ThreadsMediaChildrenResponse> {
    return this.request<ThreadsMediaChildrenResponse>(
      `${this.apiBaseUrl}/${containerId}/children`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'id' },
      },
    )
  }

  async deletePublishedPost(
    postId: string,
    accessToken: string,
  ): Promise<boolean> {
    await this.request<{ success: boolean }>(
      `${this.apiBaseUrl}/${postId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    return true
  }

  async deleteReply(
    replyId: string,
    accessToken: string,
  ): Promise<boolean> {
    await this.request<{ success: boolean }>(
      `${this.apiBaseUrl}/${replyId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    return true
  }

  async getPostInsights(
    objectId: string,
    accessToken: string,
    query: ThreadsGraphQueryInput = {},
  ): Promise<ThreadsInsightsResponse> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const metric = typeof graphQuery['metric'] === 'string'
      ? graphQuery['metric']
      : 'views,likes,replies,reposts,quotes,shares'
    return this.request<ThreadsInsightsResponse>(
      `${this.apiBaseUrl}/${objectId}/insights`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          metric,
          ...graphQuery,
        },
      },
    )
  }

  async getAccountInsights(
    userId: string,
    accessToken: string,
    query: ThreadsGraphQueryInput = {},
  ): Promise<ThreadsInsightsResponse> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const metric = typeof graphQuery['metric'] === 'string'
      ? graphQuery['metric']
      : 'views,likes,replies,reposts,quotes,followers_count'
    return this.request<ThreadsInsightsResponse>(
      `${this.apiBaseUrl}/${userId}/threads_insights`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          metric,
          ...graphQuery,
        },
      },
    )
  }

  async listReplies(
    objectId: string,
    accessToken: string,
    params?: { after?: string, before?: string, limit?: number },
  ): Promise<ThreadsReplyListResponse> {
    return this.request<ThreadsReplyListResponse>(
      `${this.apiBaseUrl}/${objectId}/replies`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields: 'id,text,username,timestamp,permalink',
          after: params?.after,
          before: params?.before,
          limit: params?.limit,
        },
      },
    )
  }

  async hideReply(
    replyId: string,
    accessToken: string,
    hidden: boolean,
  ): Promise<ThreadsManageReplyResponse> {
    return this.request<ThreadsManageReplyResponse>(
      `${this.apiBaseUrl}/${replyId}/manage_reply`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { hide: hidden },
      },
    )
  }
}
