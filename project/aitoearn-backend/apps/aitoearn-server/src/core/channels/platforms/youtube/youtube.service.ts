import type { AxiosError, AxiosInstance } from 'axios'
import type { Credentials } from 'google-auth-library'
import type { youtube_v3 } from 'googleapis'
import type { YouTubeErrorBody } from './youtube.exception'
import { Injectable } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { GaxiosError } from 'gaxios'
import { google } from 'googleapis'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { YoutubeConfig } from './youtube.config'
import { YouTubePlatformException } from './youtube.exception'
import { YoutubeOAuthGrantType, YoutubeSearchOrder, YoutubeSearchType } from './youtube.schema'

@Injectable()
export class YoutubeService {
  private readonly http: AxiosInstance

  constructor(
    private readonly cfg: YoutubeConfig,
    private readonly mediaService: MediaService,
  ) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<YouTubeErrorBody>) => {
        throw YouTubePlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      this.cfg.clientId,
      this.cfg.clientSecret,
      this.cfg.redirectUri,
    )
  }

  private createYouTubeClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.youtube({ version: 'v3', auth })
  }

  private throwGoogleApisError(error: unknown): never {
    if (error instanceof YouTubePlatformException) {
      throw error
    }
    if (error instanceof GaxiosError) {
      throw YouTubePlatformException.fromGaxiosError(error)
    }
    throw error
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const oauth2Client = this.createOAuth2Client()
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent',
    })
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const oauth2Client = this.createOAuth2Client()
    let tokens: Credentials
    try {
      const result = await oauth2Client.getToken(code) as { tokens: Credentials }
      tokens = result.tokens
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
    if (!tokens.access_token) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelAccessTokenFailed,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'exchangeCode' },
      })
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope ?? undefined,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: YoutubeOAuthGrantType.RefreshToken,
    })

    const response = await this.http.post<{
      access_token: string
      refresh_token?: string
      expires_in?: number
      scope?: string
    }>('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scope: data.scope,
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    email?: string
  }> {
    const response = await this.http.get<{
      sub: string
      name: string
      picture?: string
      email?: string
    }>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return {
      platformUid: response.data.sub,
      displayName: response.data.name,
      avatarUrl: response.data.picture,
      email: response.data.email,
    }
  }

  async revokeAccessToken(accessToken: string): Promise<void> {
    await this.http.post('https://oauth2.googleapis.com/revoke', null, {
      params: { token: accessToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async getChannelInfo(accessToken: string, channelId: string): Promise<{
    channelId: string
    title: string
    description?: string
    thumbnailUrl?: string
    subscriberCount?: number
    videoCount?: number
    viewCount?: number
  }> {
    const channels = await this.listChannelInfo(accessToken)
    const channel = channels.find(item => item.channelId === channelId)
    if (!channel) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformAccountMissing,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'getChannelInfo' },
      })
    }

    return channel
  }

  async listChannelInfo(accessToken: string): Promise<Array<{
    channelId: string
    title: string
    description?: string
    thumbnailUrl?: string
    subscriberCount?: number
    videoCount?: number
    viewCount?: number
  }>> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.channels.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        mine: true,
      })
      return (response.data.items ?? []).map((channel: youtube_v3.Schema$Channel) => ({
        channelId: channel.id!,
        title: channel.snippet?.title ?? '',
        description: channel.snippet?.description ?? undefined,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? undefined,
        subscriberCount: this.parseOptionalNumber(channel.statistics?.subscriberCount),
        videoCount: this.parseOptionalNumber(channel.statistics?.videoCount),
        viewCount: this.parseOptionalNumber(channel.statistics?.viewCount),
      }))
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async search(
    accessToken: string,
    params: {
      channelId?: string
      part?: string
      order?: YoutubeSearchOrder
      maxResults?: number
      pageToken?: string
      type?: YoutubeSearchType
      query?: string
    },
  ) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.search.list({
        part: this.parsePart(params.part, ['snippet']),
        ...(params.channelId && { channelId: params.channelId }),
        ...(params.order && { order: params.order }),
        maxResults: params.maxResults,
        ...(params.pageToken && { pageToken: params.pageToken }),
        ...(params.type && { type: [params.type] }),
        ...(params.query && { q: params.query }),
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async listChannels(
    accessToken: string,
    params: {
      part?: string
      id?: string
      forHandle?: string
      forUsername?: string
      mine?: boolean
      maxResults?: number
      pageToken?: string
    },
  ) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.channels.list({
        part: this.parsePart(params.part, ['snippet', 'contentDetails', 'statistics']),
        ...(params.id && { id: params.id.split(',').map(id => id.trim()).filter(Boolean) }),
        ...(params.forHandle && { forHandle: params.forHandle }),
        ...(params.forUsername && { forUsername: params.forUsername }),
        mine: params.mine,
        maxResults: params.maxResults,
        ...(params.pageToken && { pageToken: params.pageToken }),
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async listVideos(
    accessToken: string,
    params: {
      part?: string
      id?: string
      chart?: string
      myRating?: string
      maxResults?: number
      pageToken?: string
    },
  ) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.videos.list({
        part: this.parsePart(params.part, ['snippet', 'statistics']),
        ...(params.id && { id: params.id.split(',').map(id => id.trim()).filter(Boolean) }),
        ...(params.chart && { chart: params.chart }),
        ...(params.myRating && { myRating: params.myRating }),
        maxResults: params.maxResults,
        ...(params.pageToken && { pageToken: params.pageToken }),
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  private parseOptionalNumber(value: string | null | undefined): number | undefined {
    if (value === undefined || value === null) {
      return undefined
    }
    return Number(value)
  }

  private parsePart(value: string | undefined, fallback: string[]) {
    return value
      ? value.split(',').map(item => item.trim()).filter(Boolean)
      : fallback
  }

  async listVideoCategories(
    accessToken: string,
    params: {
      id?: string
      regionCode?: string
    } = {},
  ) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.videoCategories.list({
        part: ['snippet'],
        ...(params.id && { id: [params.id] }),
        ...(params.regionCode && { regionCode: params.regionCode }),
      })
      return response.data.items ?? []
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async uploadVideo(
    accessToken: string,
    params: {
      title: string
      description?: string
      tags?: string[]
      privacyStatus: 'private' | 'public' | 'unlisted'
      videoUrl: string
      categoryId?: string
      publishAt?: string
      license?: 'creativeCommon' | 'youtube'
      embeddable?: boolean
      notifySubscribers?: boolean
      selfDeclaredMadeForKids?: boolean
      containsSyntheticMedia?: boolean
    },
  ): Promise<{ videoId: string }> {
    const youtube = this.createYouTubeClient(accessToken)

    // Download video from URL
    const videoStream = await this.mediaService.getStream({
      platform: AccountType.YouTube,
      endpoint: 'uploadVideo.downloadMedia',
      url: params.videoUrl,
    })

    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: params.title,
            description: params.description ?? '',
            tags: params.tags,
            categoryId: params.categoryId ?? '22',
          },
          status: this.compactStatus({
            privacyStatus: params.privacyStatus,
            publishAt: params.publishAt,
            license: params.license,
            embeddable: params.embeddable,
            selfDeclaredMadeForKids: params.selfDeclaredMadeForKids,
            containsSyntheticMedia: params.containsSyntheticMedia,
          }),
        },
        media: {
          body: videoStream,
        },
        notifySubscribers: params.notifySubscribers,
      })

      return { videoId: response.data.id! }
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async updateVideo(
    accessToken: string,
    videoId: string,
    params: {
      title?: string
      description?: string
      tags?: string[]
      privacyStatus?: 'private' | 'public' | 'unlisted'
      categoryId?: string
      publishAt?: string
      license?: 'creativeCommon' | 'youtube'
      embeddable?: boolean
      selfDeclaredMadeForKids?: boolean
      containsSyntheticMedia?: boolean
    },
  ): Promise<void> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const statusPatch = this.compactStatus({
        privacyStatus: params.privacyStatus,
        publishAt: params.publishAt,
        license: params.license,
        embeddable: params.embeddable,
        selfDeclaredMadeForKids: params.selfDeclaredMadeForKids,
        containsSyntheticMedia: params.containsSyntheticMedia,
      })
      const hasStatusPatch = Object.keys(statusPatch).length > 0
      const listPart = hasStatusPatch ? ['snippet', 'status'] : ['snippet']
      const existing = await youtube.videos.list({
        part: listPart,
        id: [videoId],
      })
      const video = existing.data.items?.[0]
      if (!video) {
        throw YouTubePlatformException.validation({
          code: ResponseCode.ChannelPlatformWorkNotFound,
          category: PlatformErrorCategory.Validation,
          context: {
            endpoint: 'updateVideo',
            platformWorkId: videoId,
          },
        })
      }

      const part = ['snippet']
      const requestBody: {
        id: string
        snippet: {
          title: string
          description: string
          tags?: string[]
          categoryId: string
        }
        status?: Record<string, unknown>
      } = {
        id: videoId,
        snippet: {
          title: params.title ?? video.snippet?.title ?? '',
          description: params.description ?? video.snippet?.description ?? '',
          tags: params.tags ?? video.snippet?.tags ?? undefined,
          categoryId: params.categoryId ?? video.snippet?.categoryId ?? '22',
        },
      }
      if (hasStatusPatch) {
        part.push('status')
        requestBody.status = this.compactStatus({
          privacyStatus: video.status?.privacyStatus,
          publishAt: video.status?.publishAt,
          license: video.status?.license,
          embeddable: video.status?.embeddable,
          publicStatsViewable: video.status?.publicStatsViewable,
          selfDeclaredMadeForKids: video.status?.selfDeclaredMadeForKids,
          containsSyntheticMedia: video.status?.containsSyntheticMedia,
          ...statusPatch,
        })
      }

      await youtube.videos.update({
        part,
        requestBody,
      })
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  private compactStatus(input: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    )
  }

  async setThumbnail(
    accessToken: string,
    videoId: string,
    thumbnailUrl: string,
  ): Promise<void> {
    const youtube = this.createYouTubeClient(accessToken)

    const thumbnailBuffer = await this.mediaService.getBuffer({
      platform: AccountType.YouTube,
      endpoint: 'setThumbnail.downloadMedia',
      url: thumbnailUrl,
      platformWorkId: videoId,
    })
    if (thumbnailBuffer.length > 2 * 1024 * 1024) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformMediaUnsupported,
        category: PlatformErrorCategory.MediaProcessingFailed,
        context: {
          endpoint: 'setThumbnail',
          platformWorkId: videoId,
        },
      })
    }

    try {
      await youtube.thumbnails.set({
        videoId,
        media: {
          mimeType: 'image/jpeg',
          body: thumbnailBuffer,
        },
      })
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async getVideoDetails(
    accessToken: string,
    videoId: string,
  ): Promise<{
    channelId?: string
    title: string
    description?: string
    publishedAt?: string
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }> {
    const youtube = this.createYouTubeClient(accessToken)
    let response: youtube_v3.Schema$VideoListResponse
    try {
      response = (await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId],
      })).data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }

    const video = response.items?.[0]
    if (!video) {
      throw YouTubePlatformException.validation({
        code: ResponseCode.ChannelPlatformWorkNotFound,
        category: PlatformErrorCategory.Validation,
        context: {
          endpoint: 'getVideoDetails',
          platformWorkId: videoId,
        },
      })
    }

    return {
      channelId: video.snippet?.channelId ?? undefined,
      title: video.snippet?.title ?? '',
      description: video.snippet?.description ?? undefined,
      publishedAt: video.snippet?.publishedAt ?? undefined,
      viewCount: video.statistics?.viewCount ?? undefined,
      likeCount: video.statistics?.likeCount ?? undefined,
      commentCount: video.statistics?.commentCount ?? undefined,
    }
  }

  async listComments(
    accessToken: string,
    videoId: string,
    params?: { cursor?: string, limit?: number },
  ): Promise<youtube_v3.Schema$CommentThreadListResponse> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        pageToken: params?.cursor,
        maxResults: params?.limit,
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async createComment(
    accessToken: string,
    videoId: string,
    textOriginal: string,
  ): Promise<youtube_v3.Schema$CommentThread> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.commentThreads.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            videoId,
            topLevelComment: {
              snippet: { textOriginal },
            },
          },
        },
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async replyComment(
    accessToken: string,
    parentId: string,
    textOriginal: string,
  ): Promise<youtube_v3.Schema$Comment> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId,
            textOriginal,
          },
        },
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async deleteComment(accessToken: string, commentId: string): Promise<void> {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      await youtube.comments.delete({ id: commentId })
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async listCaptions(accessToken: string, videoId: string) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.captions.list({
        part: ['snippet'],
        videoId,
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async listPlaylists(accessToken: string) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50,
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }

  async addVideoToPlaylist(
    accessToken: string,
    playlistId: string,
    videoId: string,
  ) {
    const youtube = this.createYouTubeClient(accessToken)
    try {
      const response = await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
      })
      return response.data
    }
    catch (error) {
      this.throwGoogleApisError(error)
    }
  }
}
