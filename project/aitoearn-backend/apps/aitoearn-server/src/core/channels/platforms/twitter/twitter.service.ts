import type { Media } from '@xdevplatform/xdk'
import type { AxiosError, AxiosInstance } from 'axios'
import type { ChannelPlatformErrorContext } from '../platforms.exception'
import type { TwitterReplySettings } from './twitter.enum'
import type { TwitterOAuthErrorBody } from './twitter.exception'
import type {
  TwitterCreatePostBody,
  TwitterMediaCategory,
  TwitterMediaProcessingInfo,
  TwitterMediaType,
  TwitterMediaUploadData,
  TwitterPostListResponse,
  TwitterPostResponse,
  TwitterTimelineListInput,
  TwitterUserAnalyticsResponse,
} from './twitter.interface'
import { Injectable, Logger } from '@nestjs/common'
import { ApiError, Client, OAuth2 } from '@xdevplatform/xdk'
import { ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ChannelPlatformException, PlatformErrorCategory } from '../platforms.exception'
import { TwitterConfig } from './twitter.config'
import { TwitterPlatformException, TwitterWorkLinkException, TwitterWorkNotFoundException } from './twitter.exception'

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name)
  private readonly oauthHttp: AxiosInstance

  constructor(
    private readonly cfg: TwitterConfig,
  ) {
    this.oauthHttp = this.createOAuthHttpClient()
  }

  private createOAuthHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<TwitterOAuthErrorBody>) => {
        throw TwitterPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private createOAuth2Client(scopes?: string[]) {
    return new OAuth2({
      clientId: this.cfg.clientId,
      clientSecret: this.cfg.clientSecret || undefined,
      redirectUri: this.cfg.redirectUri,
      scope: scopes,
    })
  }

  private createApiClient(accessToken: string): Client {
    return new Client({
      accessToken,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async generateAuthUrl(
    scopes: string[],
    state: string,
    codeVerifier: string,
    codeChallenge?: string,
  ): Promise<{ url: string, codeVerifier: string, codeChallenge?: string }> {
    let url: string
    try {
      const oauth = this.createOAuth2Client(scopes)
      await oauth.setPkceParameters(codeVerifier, codeChallenge)
      url = await oauth.getAuthorizationUrl(state)
    }
    catch (error) {
      if (error instanceof Error) {
        throw TwitterPlatformException.fromSdkOAuthError(error, {
          code: ResponseCode.ChannelPlatformApiFailed,
          context: { endpoint: 'GET /i/oauth2/authorize' },
        })
      }
      throw error
    }

    return { url, codeVerifier, codeChallenge }
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    let credential: Awaited<ReturnType<OAuth2['exchangeCode']>>
    try {
      const oauth = this.createOAuth2Client()
      credential = await oauth.exchangeCode(code, codeVerifier)
    }
    catch (error) {
      if (error instanceof Error) {
        throw TwitterPlatformException.fromSdkOAuthError(error, {
          code: ResponseCode.ChannelAccessTokenFailed,
          context: { endpoint: 'POST /2/oauth2/token' },
        })
      }
      throw error
    }

    return {
      accessToken: credential.access_token,
      refreshToken: credential.refresh_token,
      expiresAt: credential.expires_in ? new Date(Date.now() + credential.expires_in * 1000) : undefined,
      scope: credential.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    let credential: Awaited<ReturnType<OAuth2['refreshToken']>>
    try {
      const oauth = this.createOAuth2Client()
      credential = await oauth.refreshToken(refreshToken)
    }
    catch (error) {
      if (error instanceof Error) {
        throw TwitterPlatformException.fromSdkOAuthError(error, {
          code: ResponseCode.ChannelRefreshTokenFailed,
          context: { endpoint: 'POST /2/oauth2/token' },
        })
      }
      throw error
    }

    return {
      accessToken: credential.access_token,
      refreshToken: credential.refresh_token ?? refreshToken,
      expiresAt: credential.expires_in ? new Date(Date.now() + credential.expires_in * 1000) : undefined,
      scope: credential.scope,
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    const params = new URLSearchParams({ token: accessToken })
    if (!this.cfg.clientSecret) {
      params.append('client_id', this.cfg.clientId)
    }

    const oauthRequestHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(this.cfg.clientSecret
        ? {
            Authorization: `Basic ${Buffer.from(
              `${this.cfg.clientId}:${this.cfg.clientSecret}`,
            ).toString('base64')}`,
          }
        : {}),
    }

    const response = await this.oauthHttp.post<{ revoked?: boolean }>(
      'https://api.x.com/2/oauth2/revoke',
      params.toString(),
      { headers: oauthRequestHeaders },
    )

    return Boolean(response.data?.revoked ?? true)
  }

  async getUserInfo(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    username?: string
    followersCount?: number
    followingCount?: number
    tweetCount?: number
  }> {
    const response = await this.runApiClientOperation({
      accessToken,
      endpoint: 'GET /2/users/me',
      call: client => client.users.getMe({
        userFields: ['id', 'name', 'profile_image_url', 'username', 'public_metrics'],
      }),
    })

    const user = response.data
    if (!user) {
      throw new TwitterPlatformException('Twitter user profile not found')
    }
    const { followersCount, followingCount, tweetCount } = user.publicMetrics ?? {}
    return {
      platformUid: user.id,
      displayName: user.name,
      avatarUrl: user.profileImageUrl,
      username: user.username,
      followersCount,
      followingCount,
      tweetCount,
    }
  }

  async createPost(
    accessToken: string,
    params: {
      text: string
      mediaIds?: string[]
      replyTo?: string
      quoteTweetId?: string
      replySettings?: TwitterReplySettings
      poll?: { options: string[], duration_minutes: number }
      madeWithAi?: boolean
      paidPartnership?: boolean
      accountId?: string
    },
  ): Promise<{ postId: string, permalink: string }> {
    const body: TwitterCreatePostBody = {
      text: params.text,
      ...(params.mediaIds?.length ? { media: { media_ids: params.mediaIds } } : {}),
      ...(params.replyTo ? { reply: { in_reply_to_tweet_id: params.replyTo } } : {}),
      ...(params.quoteTweetId ? { quote_tweet_id: params.quoteTweetId } : {}),
      ...(params.replySettings ? { reply_settings: params.replySettings } : {}),
      ...(params.poll ? { poll: params.poll } : {}),
      made_with_ai: params.madeWithAi,
      paid_partnership: params.paidPartnership,
    }

    const response = await this.runApiClientOperation<TwitterPostResponse>({
      accessToken,
      endpoint: 'POST /2/tweets',
      context: { accountId: params.accountId },
      call: client => client.posts.create(body),
    })
    const postId = response.data?.id
    if (typeof postId !== 'string') {
      throw new TwitterPlatformException('Twitter post id missing')
    }

    return {
      postId,
      permalink: `https://x.com/i/status/${postId}`,
    }
  }

  async deletePost(accessToken: string, postId: string, accountId?: string): Promise<boolean> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'DELETE /2/tweets/:id',
      context: { accountId, platformWorkId: postId },
      call: client => client.posts.delete(postId),
    })
    return true
  }

  async initMediaUpload(
    accessToken: string,
    params: { mediaType: TwitterMediaType, totalBytes: number, mediaCategory?: TwitterMediaCategory },
  ): Promise<{ mediaId: string }> {
    const body: Media.InitializeUploadRequest = {
      mediaType: params.mediaType,
      totalBytes: params.totalBytes,
    }
    if (params.mediaCategory) {
      body.mediaCategory = params.mediaCategory
    }
    const response = await this.runApiClientOperation<{ data?: TwitterMediaUploadData }>({
      accessToken,
      endpoint: 'POST /2/media/upload/initialize',
      category: PlatformErrorCategory.MediaProcessingFailed,
      call: client => client.media.initializeUpload({
        body,
      }),
    })

    const mediaId = response.data?.id
    if (typeof mediaId !== 'string') {
      throw new TwitterPlatformException('Twitter media id missing')
    }
    return { mediaId }
  }

  async appendMediaUpload(
    accessToken: string,
    params: { mediaId: string, media: Blob, segmentIndex: number },
  ): Promise<void> {
    const formData = new FormData()
    formData.append('segment_index', String(params.segmentIndex))
    formData.append('media', params.media, 'media')

    try {
      await axios.post(
        `https://api.x.com/2/media/upload/${params.mediaId}/append`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      )
    }
    catch (error) {
      if (axios.isAxiosError(error)) {
        throw TwitterPlatformException.fromAxiosError(error)
      }
      throw error
    }
  }

  async finalizeMediaUpload(
    accessToken: string,
    mediaId: string,
  ): Promise<{ mediaId: string, processingInfo?: TwitterMediaProcessingInfo }> {
    const response = await this.runApiClientOperation<{ data?: TwitterMediaUploadData }>({
      accessToken,
      endpoint: 'POST /2/media/upload/finalize',
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { metadata: { mediaId } },
      call: client => client.media.finalizeUpload(mediaId),
    })

    const data = response.data
    const responseMediaId = data?.id ?? data?.media_id_string

    return {
      mediaId: typeof responseMediaId === 'string' ? responseMediaId : mediaId,
      processingInfo: data?.processingInfo ?? data?.processing_info,
    }
  }

  async getMediaStatus(
    accessToken: string,
    mediaId: string,
  ): Promise<{ mediaId: string, processingInfo?: TwitterMediaProcessingInfo }> {
    const response = await this.runApiClientOperation<{ data?: TwitterMediaUploadData }>({
      accessToken,
      endpoint: 'GET /2/media/upload',
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { metadata: { mediaId } },
      call: client => client.media.getUploadStatus(mediaId, {
        command: 'STATUS',
      }),
    })

    const data = response.data
    const responseMediaId = data?.id ?? data?.media_id_string

    return {
      mediaId: typeof responseMediaId === 'string' ? responseMediaId : mediaId,
      processingInfo: data?.processingInfo ?? data?.processing_info,
    }
  }

  async createMediaMetadata(
    accessToken: string,
    params: { mediaId: string, altText?: string, accountId?: string },
  ): Promise<void> {
    const body: Media.CreateMetadataRequest = {
      id: params.mediaId,
      ...(params.altText ? { metadata: { alt_text: { text: params.altText } } } : {}),
    }
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'POST /2/media/metadata',
      category: PlatformErrorCategory.MediaProcessingFailed,
      context: { accountId: params.accountId, metadata: { mediaId: params.mediaId } },
      call: client => client.media.createMetadata({
        body,
      }),
    })
  }

  async getPostDetail(accessToken: string, accountId: string, postId: string): Promise<TwitterPostResponse> {
    return this.runReadOperation({
      accessToken,
      accountId,
      endpoint: 'GET /2/tweets/:id',
      call: client => client.posts.getById(postId, this.postDetailQuery()),
    })
  }

  async getUserAnalytics(accessToken: string, accountId: string, userId: string): Promise<TwitterUserAnalyticsResponse> {
    return this.runReadOperation({
      accessToken,
      accountId,
      endpoint: 'GET /2/users/:id',
      call: client => client.users.getById(userId, {
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      }),
    })
  }

  async getPostAnalytics(accessToken: string, accountId: string, postId: string): Promise<TwitterPostResponse> {
    return this.getPostDetail(accessToken, accountId, postId)
  }

  async listUserTimeline(
    accessToken: string,
    accountId: string,
    userId: string,
    params: TwitterTimelineListInput = {},
  ): Promise<TwitterPostListResponse> {
    return this.runReadOperation({
      accessToken,
      accountId,
      endpoint: 'GET /2/users/:id/timelines/reverse_chronological',
      call: client => client.users.getTimeline(userId, {
        ...this.toTimelineQuery(params),
        ...this.postDetailQuery(),
      }),
    })
  }

  async listWorks(
    accessToken: string,
    accountId: string,
    userId: string,
    params: TwitterTimelineListInput = {},
  ): Promise<TwitterPostListResponse> {
    return this.runReadOperation({
      accessToken,
      accountId,
      endpoint: 'GET /2/users/:id/tweets',
      call: client => client.users.getPosts(userId, {
        ...this.toTimelineQuery({
          ...params,
          exclude: params.exclude ?? ['replies', 'retweets'],
        }),
        ...this.postDetailQuery(),
      }),
    })
  }

  async listReplies(accessToken: string, accountId: string, postId: string, params?: { cursor?: string, limit?: number }): Promise<TwitterPostListResponse> {
    return this.runReadOperation({
      accessToken,
      accountId,
      endpoint: 'GET /2/tweets/search/recent',
      call: client => client.posts.searchRecent(`conversation_id:${postId} is:reply`, {
        max_results: params?.limit,
        next_token: params?.cursor,
        ...this.postDetailQuery(),
      }),
    })
  }

  async likePost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'POST /2/users/:id/likes',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.likePost(userId, { body: { tweetId: postId } }),
    })
  }

  async unlikePost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'DELETE /2/users/:id/likes/:tweetId',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.unlikePost(userId, postId),
    })
  }

  async bookmarkPost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'POST /2/users/:id/bookmarks',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.createBookmark(userId, { tweetId: postId }),
    })
  }

  async removeBookmarkPost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'DELETE /2/users/:id/bookmarks/:tweetId',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.deleteBookmark(userId, postId),
    })
  }

  async repostPost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'POST /2/users/:id/retweets',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.repostPost(userId, { body: { tweetId: postId } }),
    })
  }

  async undoRepostPost(accessToken: string, accountId: string, userId: string, postId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'DELETE /2/users/:id/retweets/:sourceTweetId',
      context: { accountId, platformWorkId: postId },
      call: client => client.users.unrepostPost(userId, postId),
    })
  }

  async followUser(accessToken: string, accountId: string, userId: string, targetUserId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'POST /2/users/:id/following',
      context: { accountId },
      call: client => client.users.followUser(userId, { body: { targetUserId } }),
    })
  }

  async unfollowUser(accessToken: string, accountId: string, userId: string, targetUserId: string): Promise<void> {
    await this.runApiClientOperation({
      accessToken,
      endpoint: 'DELETE /2/users/:sourceUserId/following/:targetUserId',
      context: { accountId },
      call: client => client.users.unfollowUser(userId, targetUserId),
    })
  }

  async getLinkInfo(link: string): Promise<{ platformWorkId: string, resolvedUrl: string }> {
    const resolvedLink = await this.normalizeWorkLink(link)
    const platformWorkId = this.parsePostIdFromLink(resolvedLink)
    if (!platformWorkId) {
      throw new TwitterWorkLinkException({ link })
    }
    return {
      platformWorkId,
      resolvedUrl: `https://x.com/i/status/${platformWorkId}`,
    }
  }

  async verifyOwnership(accessToken: string, accountId: string, platformUid: string | undefined, postId: string): Promise<boolean> {
    const detail = await this.getPostDetail(accessToken, accountId, postId)
    const authorId = detail.data?.authorId ?? detail.data?.author_id
    if (!authorId) {
      throw new TwitterWorkNotFoundException({ postId })
    }
    return Boolean(platformUid && authorId === platformUid)
  }

  private async runApiClientOperation<T>(input: {
    accessToken: string
    endpoint: string
    code?: ResponseCode
    category?: PlatformErrorCategory
    context?: ChannelPlatformErrorContext
    call: (client: Client) => Promise<T>
  }): Promise<T> {
    try {
      return await input.call(this.createApiClient(input.accessToken))
    }
    catch (error) {
      if (error instanceof ChannelPlatformException) {
        throw error
      }
      if (error instanceof ApiError) {
        const exception = TwitterPlatformException.fromSdkApiError(error, {
          code: input.code ?? ResponseCode.ChannelPlatformApiFailed,
          category: input.category,
          context: {
            ...input.context,
            endpoint: input.endpoint,
          },
        })
        this.logger.error(exception, 'Twitter SDK operation failed')
        throw exception
      }
      throw error
    }
  }

  private async runReadOperation<TResponse>(input: {
    accessToken: string
    accountId: string
    endpoint: string
    call: (client: Client) => Promise<TResponse>
  }): Promise<TResponse> {
    try {
      return await input.call(this.createApiClient(input.accessToken))
    }
    catch (error) {
      if (error instanceof ChannelPlatformException) {
        this.logger.error(error, 'Twitter read operation failed')
        throw error
      }
      if (!(error instanceof ApiError)) {
        throw error
      }
      const exception = TwitterPlatformException.fromSdkApiError(error, {
        code: ResponseCode.ChannelPlatformApiFailed,
        context: {
          accountId: input.accountId,
          endpoint: input.endpoint,
        },
      })
      this.logger.error(exception, 'Twitter read operation failed')
      throw exception
    }
  }

  private postDetailQuery() {
    return {
      tweetFields: ['id', 'text', 'author_id', 'created_at', 'public_metrics', 'attachments', 'conversation_id'],
      expansions: ['attachments.media_keys', 'author_id'],
      mediaFields: ['media_key', 'type', 'url', 'preview_image_url', 'public_metrics'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
    }
  }

  private toTimelineQuery(params: TwitterTimelineListInput) {
    return {
      ...(params.startTime && { startTime: params.startTime }),
      ...(params.endTime && { endTime: params.endTime }),
      ...(params.sinceId && { sinceId: params.sinceId }),
      ...(params.untilId && { untilId: params.untilId }),
      ...(params.paginationToken && { paginationToken: params.paginationToken }),
      maxResults: params.maxResults,
      ...(params.exclude?.length && { exclude: params.exclude }),
    }
  }

  private parsePostIdFromLink(link: string): string | undefined {
    if (/^\d+$/.test(link)) {
      return link
    }
    try {
      const url = new URL(link)
      if (!/(?:^|\.)x\.com$|(?:^|\.)twitter\.com$/.test(url.hostname)) {
        return undefined
      }
      const parts = url.pathname.split('/').filter(Boolean)
      const statusIndex = parts.findIndex(part => ['status', 'statuses'].includes(part))
      const postId = statusIndex >= 0 ? parts[statusIndex + 1] : undefined
      return postId && /^\d+$/.test(postId) ? postId : undefined
    }
    catch (error) {
      this.logger.warn(error, 'Failed to parse Twitter work link')
      return undefined
    }
  }

  private async normalizeWorkLink(link: string): Promise<string> {
    try {
      const url = new URL(link)
      if (url.hostname.replace(/^www\./, '') === 't.co') {
        const response = await axios.get(link, {
          maxRedirects: 5,
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        })
        return response.request?.res?.responseUrl || response.config?.url || link
      }
    }
    catch (error) {
      this.logger.warn(error, 'Failed to normalize Twitter work link')
      return link
    }
    return link
  }
}
