import type { AxiosError, AxiosInstance } from 'axios'
import type { FacebookErrorBody } from './facebook.exception'
import type {
  FacebookComment,
  FacebookCommentCreateResponse,
  FacebookGraphQueryInput,
  FacebookInsight,
  FacebookPage,
  FacebookPagePostPublishResult,
  FacebookPhotoFeedBody,
  FacebookPhotoStoryPublishResult,
  FacebookPost,
  FacebookReelPublishResult,
  FacebookVideoPublishResult,
  FacebookVideoStatusResult,
  FacebookVideoStoryPublishResult,
  GraphApiResponse,
} from './facebook.interface'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { normalizePlatformGraphQuery } from '../platforms.utils'
import { FacebookConfig } from './facebook.config'
import { FacebookContentCategory, FacebookOAuthGrantType, FacebookVideoStatus } from './facebook.enum'
import { FacebookPlatformException } from './facebook.exception'

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly http: AxiosInstance

  constructor(
    private readonly cfg: FacebookConfig,
    private readonly mediaService: MediaService,
  ) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<FacebookErrorBody>) => {
        throw FacebookPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private get graphApiBaseUrl(): string {
    return `https://graph.facebook.com/${this.cfg.graphApiVersion}`
  }

  private get facebookDialogBaseUrl(): string {
    return `https://www.facebook.com/${this.cfg.graphApiVersion}`
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: scopes.join(','),
      state,
      response_type: 'code',
    })

    return `${this.facebookDialogBaseUrl}/dialog/oauth?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: this.cfg.redirectUri,
      code,
    })

    const response = await this.http.get<{
      access_token: string
      token_type: string
      expires_in?: number
    }>(`${this.graphApiBaseUrl}/oauth/access_token`, { params })

    const data = response.data
    const shortLivedToken = data.access_token

    return this.extendAccessToken(shortLivedToken)
  }

  async extendAccessToken(shortLivedToken: string): Promise<{
    accessToken: string
    expiresAt?: Date
  }> {
    const params = new URLSearchParams({
      grant_type: FacebookOAuthGrantType.ExchangeToken,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      fb_exchange_token: shortLivedToken,
    })

    const response = await this.http.get<{
      access_token: string
      expires_in?: number
    }>(`${this.graphApiBaseUrl}/oauth/access_token`, { params })

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
      grant_type: FacebookOAuthGrantType.ExchangeToken,
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      fb_exchange_token: accessToken,
    })

    const response = await this.http.get<{
      access_token: string
      expires_in?: number
    }>(`${this.graphApiBaseUrl}/oauth/access_token`, { params })

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

  async getFacebookUser(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
  }> {
    const response = await this.http.get<{
      id: string
      name: string
      picture?: { data?: { url?: string } }
    }>(`${this.graphApiBaseUrl}/me`, {
      params: {
        fields: 'id,name,picture',
        access_token: accessToken,
      },
    })

    return {
      platformUid: response.data.id,
      displayName: response.data.name,
      avatarUrl: response.data.picture?.data?.url,
    }
  }

  async listPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await this.http.get<GraphApiResponse<FacebookPage[]>>(
      `${this.graphApiBaseUrl}/me/accounts`,
      {
        params: {
          fields: 'id,name,access_token,fan_count,followers_count,picture,tasks,category,category_list',
          access_token: accessToken,
        },
      },
    )

    return response.data.data
  }

  async getPageInfo(accessToken: string, pageId: string): Promise<FacebookPage> {
    const response = await this.http.get<FacebookPage>(
      `${this.graphApiBaseUrl}/${pageId}`,
      {
        params: {
          fields: 'id,name,fan_count,followers_count,picture,category,category_list',
          access_token: accessToken,
        },
      },
    )

    return response.data
  }

  async getPageAccessToken(
    userAccessToken: string,
    pageId: string,
  ): Promise<string> {
    const pages = await this.listPages(userAccessToken)
    const page = pages.find(p => p.id === pageId)
    if (!page) {
      const exception = FacebookPlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'getPageAccessToken', accountId: pageId },
      })
      this.logger.warn(exception, 'Facebook page access token missing')
      throw exception
    }
    return page.access_token
  }

  async createFeedPost(
    pageAccessToken: string,
    pageId: string,
    params: {
      message?: string
      imageUrl?: string
      link?: string
    },
  ): Promise<FacebookPagePostPublishResult> {
    if (params.imageUrl) {
      return this.createPhotoPost(pageAccessToken, pageId, {
        message: params.message,
        imageUrl: params.imageUrl,
      })
    }

    const body = {
      ...(params.message ? { message: params.message } : {}),
      ...(params.link ? { link: params.link } : {}),
    }

    const response = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${pageId}/feed`,
      null,
      { params: { ...body, access_token: pageAccessToken } },
    )

    return response.data
  }

  private async createPhotoPost(
    pageAccessToken: string,
    pageId: string,
    params: {
      message?: string
      imageUrl: string
    },
  ): Promise<FacebookPagePostPublishResult> {
    const body = {
      url: params.imageUrl,
      ...(params.message ? { message: params.message } : {}),
    }

    const response = await this.http.post<{
      id: string
      post_id: string
    }>(
      `${this.graphApiBaseUrl}/${pageId}/photos`,
      null,
      { params: { ...body, access_token: pageAccessToken } },
    )

    return response.data
  }

  async publishPhotoStory(
    pageAccessToken: string,
    pageId: string,
    params: {
      imageUrl: string
    },
  ): Promise<FacebookPhotoStoryPublishResult> {
    const photoResponse = await this.http.post<{
      id: string
    }>(
      `${this.graphApiBaseUrl}/${pageId}/photos`,
      null,
      {
        params: {
          url: params.imageUrl,
          published: 'false',
          access_token: pageAccessToken,
        },
      },
    )

    const storyResponse = await this.http.post<{
      post_id: string
    }>(
      `${this.graphApiBaseUrl}/${pageId}/photo_stories`,
      null,
      {
        params: {
          photo_id: photoResponse.data.id,
          access_token: pageAccessToken,
        },
      },
    )

    return {
      postId: storyResponse.data.post_id,
      photoId: photoResponse.data.id,
    }
  }

  async createMultiPhotoPost(
    pageAccessToken: string,
    pageId: string,
    params: {
      message?: string
      imageUrls: string[]
    },
  ): Promise<FacebookPagePostPublishResult> {
    const attachedMedia: Array<{ media_fbid: string }> = []

    for (const imageUrl of params.imageUrls) {
      const photoResponse = await this.http.post<{ id: string }>(
        `${this.graphApiBaseUrl}/${pageId}/photos`,
        null,
        {
          params: {
            url: imageUrl,
            published: 'false',
            access_token: pageAccessToken,
          },
        },
      )
      attachedMedia.push({ media_fbid: photoResponse.data.id })
    }

    const body: FacebookPhotoFeedBody = {
      attached_media: attachedMedia,
      ...(params.message ? { message: params.message } : {}),
    }

    const response = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${pageId}/feed`,
      body,
      { params: { access_token: pageAccessToken } },
    )

    return response.data
  }

  async uploadVideo(
    pageAccessToken: string,
    pageId: string,
    params: {
      title?: string
      description?: string
      videoUrl: string
    },
  ): Promise<FacebookVideoPublishResult> {
    const startResponse = await this.http.post<{ upload_session_id: string }>(
      `${this.graphApiBaseUrl}/${pageId}/video_reels`,
      null,
      {
        params: {
          upload_phase: 'start',
          access_token: pageAccessToken,
        },
      },
    )

    const sessionId = startResponse.data.upload_session_id

    await this.mediaService.withUploadSource({
      platform: AccountType.Facebook,
      endpoint: 'uploadVideo.downloadMedia',
      url: params.videoUrl,
    }, async (source) => {
      await this.http.post(
        `${this.graphApiBaseUrl}/${pageId}/video_reels`,
        source.stream(),
        {
          params: {
            upload_phase: 'transfer',
            upload_session_id: sessionId,
            start_offset: 0,
            access_token: pageAccessToken,
          },
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(source.sizeBytes),
          },
        },
      )
    })

    const finishParams: Record<string, string> = {
      upload_phase: 'finish',
      upload_session_id: sessionId,
      video_state: 'PUBLISHED',
      access_token: pageAccessToken,
    }
    if (params.title) {
      finishParams['title'] = params.title
    }
    if (params.description) {
      finishParams['description'] = params.description
    }
    finishParams['content_category'] = FacebookContentCategory.Reel

    const finishResponse = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${pageId}/video_reels`,
      null,
      { params: finishParams },
    )

    return finishResponse.data
  }

  async publishVideoPost(
    pageAccessToken: string,
    pageId: string,
    params: {
      title?: string
      description?: string
      videoUrl: string
      contentCategory: FacebookContentCategory.Post
    },
  ): Promise<FacebookVideoPublishResult> {
    const startResponse = await this.http.post<{
      video_id?: string
      upload_session_id: string
      start_offset?: string
      end_offset?: string
    }>(
      `${this.graphApiBaseUrl}/${pageId}/videos`,
      null,
      {
        params: {
          upload_phase: 'start',
          access_token: pageAccessToken,
        },
      },
    )

    const sessionId = startResponse.data.upload_session_id
    let startOffset = Number(startResponse.data.start_offset ?? 0)
    let endOffset = Number(startResponse.data.end_offset ?? 0)
    if (Number.isNaN(startOffset) || startOffset < 0)
      startOffset = 0

    await this.mediaService.withUploadSource({
      platform: AccountType.Facebook,
      endpoint: 'publishVideoPost.downloadMedia',
      url: params.videoUrl,
    }, async (source) => {
      if (Number.isNaN(endOffset) || endOffset <= startOffset)
        endOffset = source.sizeBytes

      while (startOffset < endOffset) {
        const chunk = await source.blob({ start: startOffset, end: endOffset - 1 })
        const formData = new FormData()
        formData.append('video_file_chunk', chunk, source.filename)

        const transferResponse = await this.http.post<{
          start_offset?: string
          end_offset?: string
        }>(
          `${this.graphApiBaseUrl}/${pageId}/videos`,
          formData,
          {
            params: {
              upload_phase: 'transfer',
              upload_session_id: sessionId,
              start_offset: startOffset,
              access_token: pageAccessToken,
            },
          },
        )

        const nextStartOffset = Number(transferResponse.data.start_offset ?? source.sizeBytes)
        const nextEndOffset = Number(transferResponse.data.end_offset ?? source.sizeBytes)
        if (Number.isNaN(nextStartOffset) || Number.isNaN(nextEndOffset) || nextStartOffset <= startOffset) {
          throw FacebookPlatformException.validation({
            code: ResponseCode.ChannelPlatformResponseInvalid,
            category: PlatformErrorCategory.Validation,
            context: { endpoint: 'publishVideoPost.transfer' },
          })
        }
        startOffset = nextStartOffset
        endOffset = nextEndOffset
      }
    })

    const finishParams: Record<string, string> = {
      upload_phase: 'finish',
      upload_session_id: sessionId,
      access_token: pageAccessToken,
    }
    if (params.title) {
      finishParams['title'] = params.title
    }
    if (params.description) {
      finishParams['description'] = params.description
    }
    finishParams['content_category'] = params.contentCategory

    const finishResponse = await this.http.post<{ id: string }>(
      `${this.graphApiBaseUrl}/${pageId}/videos`,
      null,
      { params: finishParams },
    )

    return finishResponse.data
  }

  async getPostInfo(
    accessToken: string,
    postId: string,
  ): Promise<{
    id: string
    permalinkUrl?: string
    message?: string
    createdTime?: string
  }> {
    const response = await this.http.get<{
      id: string
      permalink_url?: string | null
      message?: string | null
      created_time?: string | null
    }>(`${this.graphApiBaseUrl}/${postId}`, {
      params: {
        fields: 'id,permalink_url,message,created_time',
        access_token: accessToken,
      },
    })

    return {
      id: response.data.id,
      permalinkUrl: response.data.permalink_url ?? undefined,
      message: response.data.message ?? undefined,
      createdTime: response.data.created_time ?? undefined,
    }
  }

  async deletePost(accessToken: string, postId: string): Promise<boolean> {
    await this.http.delete(`${this.graphApiBaseUrl}/${postId}`, {
      params: { access_token: accessToken },
    })
    return true
  }

  async getVideoStatus(
    accessToken: string,
    videoId: string,
  ): Promise<FacebookVideoStatusResult> {
    const response = await this.http.get<{
      id: string
      status?: { video_status?: string | null } | null
    }>(`${this.graphApiBaseUrl}/${videoId}`, {
      params: {
        fields: 'id,status',
        access_token: accessToken,
      },
    })

    return {
      id: response.data.id,
      status: this.parseVideoStatus(response.data.status?.video_status ?? undefined),
    }
  }

  private parseVideoStatus(status: string | undefined): FacebookVideoStatus | undefined {
    const normalizedStatus = status?.toLowerCase()
    if (normalizedStatus === FacebookVideoStatus.Ready)
      return FacebookVideoStatus.Ready
    if (normalizedStatus === FacebookVideoStatus.Published)
      return FacebookVideoStatus.Published
    if (normalizedStatus === FacebookVideoStatus.Processing)
      return FacebookVideoStatus.Processing
    if (normalizedStatus === FacebookVideoStatus.Error)
      return FacebookVideoStatus.Error
    return undefined
  }

  async publishReel(
    pageAccessToken: string,
    pageId: string,
    params: {
      videoUrl: string
      description?: string
      contentCategory: FacebookContentCategory.Reel
    },
  ): Promise<FacebookReelPublishResult> {
    const startResponse = await this.http.post<{ video_id: string, upload_url: string }>(
      `${this.graphApiBaseUrl}/${pageId}/video_reels`,
      null,
      {
        params: {
          upload_phase: 'start',
          access_token: pageAccessToken,
        },
      },
    )

    const videoId = startResponse.data.video_id
    const uploadUrl = startResponse.data.upload_url

    await this.mediaService.withUploadSource({
      platform: AccountType.Facebook,
      endpoint: 'publishReel.downloadMedia',
      url: params.videoUrl,
    }, async (source) => {
      await this.http.post(uploadUrl, source.stream(), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(source.sizeBytes),
          'Authorization': `OAuth ${pageAccessToken}`,
          'offset': '0',
          'file_size': source.sizeBytes.toString(),
        },
      })
    })

    const finishParams: Record<string, string> = {
      upload_phase: 'finish',
      video_id: videoId,
      video_state: 'PUBLISHED',
      access_token: pageAccessToken,
    }
    if (params.description) {
      finishParams['description'] = params.description
    }
    finishParams['content_category'] = params.contentCategory

    const finishResponse = await this.http.post<{
      success?: boolean
    }>(
      `${this.graphApiBaseUrl}/${pageId}/video_reels`,
      null,
      { params: finishParams },
    )
    if (finishResponse.data.success === false) {
      throw FacebookPlatformException.validation({
        code: ResponseCode.ChannelPlatformResponseInvalid,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'publishReel.finish' },
      })
    }

    return {
      videoId,
    }
  }

  async publishVideoStory(
    pageAccessToken: string,
    pageId: string,
    params: {
      videoUrl: string
      contentCategory: FacebookContentCategory.Story
    },
  ): Promise<FacebookVideoStoryPublishResult> {
    const startResponse = await this.http.post<{ video_id: string, upload_url: string }>(
      `${this.graphApiBaseUrl}/${pageId}/video_stories`,
      null,
      {
        params: {
          upload_phase: 'start',
          access_token: pageAccessToken,
        },
      },
    )

    const videoId = startResponse.data.video_id
    const uploadUrl = startResponse.data.upload_url

    await this.mediaService.withUploadSource({
      platform: AccountType.Facebook,
      endpoint: 'publishVideoStory.downloadMedia',
      url: params.videoUrl,
    }, async (source) => {
      await this.http.post(uploadUrl, source.stream(), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(source.sizeBytes),
          'Authorization': `OAuth ${pageAccessToken}`,
          'offset': '0',
          'file_size': source.sizeBytes.toString(),
        },
      })
    })

    const finishResponse = await this.http.post<{
      post_id: string
    }>(
      `${this.graphApiBaseUrl}/${pageId}/video_stories`,
      null,
      {
        params: {
          upload_phase: 'finish',
          video_id: videoId,
          content_category: params.contentCategory,
          access_token: pageAccessToken,
        },
      },
    )

    return {
      postId: finishResponse.data.post_id,
      videoId,
    }
  }

  async listComments(
    accessToken: string,
    objectId: string,
    params?: { after?: string, before?: string, limit?: number },
  ): Promise<GraphApiResponse<FacebookComment[]>> {
    const response = await this.http.get<GraphApiResponse<FacebookComment[]>>(
      `${this.graphApiBaseUrl}/${objectId}/comments`,
      {
        params: {
          fields: 'id,message,from,created_time,like_count,comment_count,parent',
          limit: params?.limit,
          after: params?.after,
          before: params?.before,
          access_token: accessToken,
        },
      },
    )

    return response.data
  }

  async listPagePosts(
    accessToken: string,
    pageId: string,
    query: FacebookGraphQueryInput = {},
  ): Promise<GraphApiResponse<FacebookPost[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const fields = typeof graphQuery['fields'] === 'string'
      ? graphQuery['fields']
      : 'id,message,created_time,permalink_url,full_picture,type,status_type,attachments{media_type,type,media,subattachments{media_type,type,media}}'
    const response = await this.http.get<GraphApiResponse<FacebookPost[]>>(
      `${this.graphApiBaseUrl}/${pageId}/posts`,
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

  async getPagePublishedPosts(
    accessToken: string,
    pageId: string,
    query: FacebookGraphQueryInput = {},
  ): Promise<GraphApiResponse<FacebookPost[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const response = await this.http.get<GraphApiResponse<FacebookPost[]>>(
      `${this.graphApiBaseUrl}/${pageId}/published_posts`,
      {
        params: {
          ...graphQuery,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }

  async listPostComments(
    accessToken: string,
    postId: string,
    query: FacebookGraphQueryInput = {},
  ): Promise<GraphApiResponse<FacebookComment[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const fields = typeof graphQuery['fields'] === 'string'
      ? graphQuery['fields']
      : 'id,message,from,created_time,like_count,comment_count,parent'
    const response = await this.http.get<GraphApiResponse<FacebookComment[]>>(
      `${this.graphApiBaseUrl}/${postId}/comments`,
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

  async createComment(
    accessToken: string,
    objectId: string,
    message: string,
  ): Promise<FacebookCommentCreateResponse> {
    const response = await this.http.post<FacebookCommentCreateResponse>(
      `${this.graphApiBaseUrl}/${objectId}/comments`,
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

  async likeObject(accessToken: string, objectId: string): Promise<void> {
    await this.http.post(`${this.graphApiBaseUrl}/${objectId}/likes`, null, {
      params: { access_token: accessToken },
    })
  }

  async unlikeObject(accessToken: string, objectId: string): Promise<void> {
    await this.http.delete(`${this.graphApiBaseUrl}/${objectId}/likes`, {
      params: { access_token: accessToken },
    })
  }

  async getPostInsights(
    accessToken: string,
    postId: string,
    query: FacebookGraphQueryInput = {},
  ): Promise<GraphApiResponse<FacebookInsight[]>> {
    const graphQuery = normalizePlatformGraphQuery(query)
    const metric = typeof graphQuery['metric'] === 'string'
      ? graphQuery['metric']
      : 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total'
    const response = await this.http.get<GraphApiResponse<FacebookInsight[]>>(
      `${this.graphApiBaseUrl}/${postId}/insights`,
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

  async getPageInsights(
    accessToken: string,
    pageId: string,
    params?: FacebookGraphQueryInput,
  ): Promise<GraphApiResponse<FacebookInsight[]>> {
    const graphQuery = normalizePlatformGraphQuery(params)
    const since = graphQuery['since']
    const until = graphQuery['until']
    const metric = typeof graphQuery['metric'] === 'string'
      ? graphQuery['metric']
      : 'page_impressions,page_post_engagements,page_fans'
    const response = await this.http.get<GraphApiResponse<FacebookInsight[]>>(
      `${this.graphApiBaseUrl}/${pageId}/insights`,
      {
        params: {
          metric,
          ...graphQuery,
          since: since instanceof Date ? since.toISOString() : since,
          until: until instanceof Date ? until.toISOString() : until,
          access_token: accessToken,
        },
      },
    )
    return response.data
  }
}
