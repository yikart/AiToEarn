import type { AxiosError, AxiosInstance } from 'axios'
import type { TikTokPlatformResponseBody } from './tiktok.exception'
import type {
  TikTokApiResponse,
  TikTokContentRequestBody,
  TikTokCreatorInfo,
  TikTokOAuthResponse,
  TikTokPhotoPostInfo,
  TikTokPhotoSourceInfo,
  TikTokPublishResponse,
  TikTokPublishStatusResponse,
  TikTokRequestOptions,
  TikTokUploadPlan,
  TikTokUserInfo,
  TikTokVideoPostInfo,
  TikTokVideoQueryResponse,
  TikTokVideoSourceInfo,
} from './tiktok.interface'
import { Injectable } from '@nestjs/common'
import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { isSafeNumber, parse } from 'lossless-json'
import { MediaService } from '../../media/media.service'
import { PlatformErrorCategory } from '../platforms.exception'
import { TiktokConfig } from './tiktok.config'
import { TikTokPlatformException } from './tiktok.exception'
import { TikTokOAuthGrantType } from './tiktok.interface'

const MIN_CHUNK_SIZE = 5 * 1024 * 1024
const MAX_SINGLE_CHUNK_SIZE = 64 * 1024 * 1024

@Injectable()
export class TikTokService {
  private readonly http: AxiosInstance

  constructor(
    private readonly cfg: TiktokConfig,
    private readonly mediaService: MediaService,
  ) {
    this.http = this.createHttpClient()
  }

  private readonly apiBaseUrl = 'https://open.tiktokapis.com/v2'
  private readonly authUrl = 'https://www.tiktok.com/v2/auth/authorize'

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      (response) => {
        if (TikTokPlatformException.hasPlatformError(response)) {
          throw TikTokPlatformException.fromPlatformResponse(response)
        }
        return response
      },
      (error: AxiosError<TikTokPlatformResponseBody>) => {
        throw TikTokPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private async apiRequest<T>(
    url: string,
    options: TikTokRequestOptions = {},
    accessToken?: string,
  ): Promise<T> {
    const headers: Record<string, string> = accessToken
      ? {
          ...(options.headers ?? {}),
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        }
      : {
          ...(options.headers ?? {}),
        }

    const response = await this.http.request<TikTokApiResponse<T>>({
      ...options,
      method: options.method ?? 'GET',
      url,
      headers,
    })

    return response.data.data
  }

  private async contentRequest<T>(
    url: string,
    data: TikTokContentRequestBody,
    accessToken: string,
  ): Promise<T> {
    const response = await this.http.post<TikTokApiResponse<T>>(
      url,
      data,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      },
    )

    return response.data.data
  }

  private async oauthRequest<T>(
    url: string,
    data: URLSearchParams,
  ): Promise<T> {
    const response = await this.http.post<T>(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data
  }

  generateAuthUrl(scopes: string[], state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_key: this.cfg.clientId,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: this.cfg.redirectUri,
      state,
    })

    if (codeChallenge) {
      params.set('code_challenge', codeChallenge)
      params.set('code_challenge_method', 'S256')
    }

    return `${this.authUrl}?${params.toString()}`
  }

  async exchangeCode(code: string, codeVerifier?: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
    openId: string
    scope: string
  }> {
    const data = new URLSearchParams({
      client_key: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      code,
      grant_type: TikTokOAuthGrantType.AuthorizationCode,
      redirect_uri: this.cfg.redirectUri,
    })

    if (codeVerifier) {
      data.set('code_verifier', codeVerifier)
    }

    const result = await this.oauthRequest<TikTokOAuthResponse>(
      `${this.apiBaseUrl}/oauth/token/`,
      data,
    )

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(Date.now() + result.expires_in * 1000),
      refreshExpiresAt: new Date(Date.now() + result.refresh_expires_in * 1000),
      openId: result.open_id,
      scope: result.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
    scope: string
  }> {
    const result = await this.oauthRequest<TikTokOAuthResponse>(
      `${this.apiBaseUrl}/oauth/token/`,
      new URLSearchParams({
        client_key: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        grant_type: TikTokOAuthGrantType.RefreshToken,
        refresh_token: refreshToken,
      }),
    )

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(Date.now() + result.expires_in * 1000),
      refreshExpiresAt: new Date(Date.now() + result.refresh_expires_in * 1000),
      scope: result.scope,
    }
  }

  async revokeAccessToken(accessToken: string): Promise<void> {
    await this.oauthRequest(
      `${this.apiBaseUrl}/oauth/revoke/`,
      new URLSearchParams({
        client_key: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        token: accessToken,
      }),
    )
  }

  async getUserInfo(accessToken: string, fields = 'open_id,union_id,avatar_url,username,display_name,bio_description,follower_count,following_count,likes_count,video_count'): Promise<{
    openId: string
    unionId?: string
    avatarUrl?: string
    username?: string
    displayName?: string
    bioDescription?: string
    followerCount?: number
    followingCount?: number
    likesCount?: number
    videoCount?: number
  }> {
    const result = await this.apiRequest<{ user: TikTokUserInfo }>(
      `${this.apiBaseUrl}/user/info/`,
      {
        params: {
          fields,
        },
      },
      accessToken,
    )

    const user = result.user
    return {
      openId: user.open_id,
      unionId: user.union_id,
      avatarUrl: user.avatar_url,
      username: user.username,
      displayName: user.display_name,
      bioDescription: user.bio_description,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      likesCount: user.likes_count,
      videoCount: user.video_count,
    }
  }

  async getCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
    return this.contentRequest<TikTokCreatorInfo>(
      `${this.apiBaseUrl}/post/publish/creator_info/query/`,
      {},
      accessToken,
    )
  }

  async listVideos(
    accessToken: string,
    cursor?: string,
    limit = 20,
    fields?: string,
  ): Promise<TikTokVideoQueryResponse> {
    const response = await this.http.post<TikTokApiResponse<TikTokVideoQueryResponse>>(
      `${this.apiBaseUrl}/video/list/`,
      {
        max_count: limit,
        cursor,
      },
      {
        params: { fields },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      },
    )
    return response.data.data
  }

  async queryVideos(
    accessToken: string,
    videoIds: string[],
  ): Promise<TikTokVideoQueryResponse> {
    const response = await this.http.post<TikTokApiResponse<TikTokVideoQueryResponse>>(
      `${this.apiBaseUrl}/video/query/`,
      {
        filters: { video_ids: videoIds },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        params: {
          fields: 'id,create_time,title,video_description,duration,cover_image_url,share_url,embed_link,view_count,like_count,comment_count,share_count',
        },
      },
    )
    return response.data.data
  }

  async initVideoPublish(
    accessToken: string,
    postInfo: TikTokVideoPostInfo,
    sourceInfo: TikTokVideoSourceInfo,
  ): Promise<TikTokPublishResponse> {
    return this.contentRequest<TikTokPublishResponse>(
      `${this.apiBaseUrl}/post/publish/video/init/`,
      {
        post_info: postInfo,
        source_info: sourceInfo,
      },
      accessToken,
    )
  }

  async initPhotoPublish(
    accessToken: string,
    postInfo: TikTokPhotoPostInfo,
    sourceInfo: TikTokPhotoSourceInfo,
  ): Promise<TikTokPublishResponse> {
    return this.contentRequest<TikTokPublishResponse>(
      `${this.apiBaseUrl}/post/publish/content/init/`,
      {
        media_type: 'PHOTO',
        post_mode: 'DIRECT_POST',
        post_info: postInfo,
        source_info: sourceInfo,
      },
      accessToken,
    )
  }

  async getPublishStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TikTokPublishStatusResponse> {
    const response = await this.http.post<TikTokApiResponse<TikTokPublishStatusResponse>>(
      `${this.apiBaseUrl}/post/publish/status/fetch/`,
      { publish_id: publishId },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        responseType: 'text',
        transformResponse: [(data: string) => parse(data, undefined, {
          parseNumber: value => isSafeNumber(value) ? Number(value) : value,
        })],
      },
    )
    return response.data.data
  }

  async cancelPublish(
    accessToken: string,
    publishId: string,
  ): Promise<void> {
    await this.contentRequest(
      `${this.apiBaseUrl}/post/publish/cancel/`,
      { publish_id: publishId },
      accessToken,
    )
  }

  async uploadVideoFile(
    uploadUrl: string,
    video: Blob,
    fileSize: number,
    contentType = 'video/mp4',
  ): Promise<void> {
    await this.http.put(uploadUrl, video, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize,
        'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      },
    })
  }

  async chunkedUploadVideoFile(
    uploadUrl: string,
    video: Blob,
    range: [number, number],
    fileSize: number,
    contentType = 'video/mp4',
  ): Promise<void> {
    await this.http.put(uploadUrl, video, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': range[1] - range[0] + 1,
        'Content-Range': `bytes ${range[0]}-${range[1]}/${fileSize}`,
      },
    })
  }

  async uploadVideo(
    uploadUrl: string,
    videoUrl: string,
  ): Promise<void> {
    await this.mediaService.withUploadSource({
      platform: AccountType.TikTok,
      endpoint: 'downloadVideo',
      url: videoUrl,
    }, async (source) => {
      const totalSize = source.sizeBytes
      const contentType = source.contentType ?? 'video/mp4'

      if (totalSize <= MAX_SINGLE_CHUNK_SIZE) {
        await this.uploadVideoFile(uploadUrl, await source.blob(), totalSize, contentType)
        return
      }

      const plan = this.getUploadPlan(totalSize)

      for (const [chunkStart, chunkEnd] of plan.ranges) {
        await this.chunkedUploadVideoFile(
          uploadUrl,
          await source.blob({ start: chunkStart, end: chunkEnd }),
          [chunkStart, chunkEnd],
          totalSize,
          contentType,
        )
      }
    })
  }

  getUploadPlan(fileSize: number): TikTokUploadPlan {
    if (fileSize <= 0) {
      throw TikTokPlatformException.fromPlatformError({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Unknown,
        context: { endpoint: 'getUploadPlan' },
        platformCode: 'invalid_file_size',
      })
    }

    if (fileSize <= MAX_SINGLE_CHUNK_SIZE) {
      return {
        chunkSize: fileSize,
        totalChunkCount: 1,
        ranges: [[0, fileSize - 1]],
      }
    }

    const chunkSize = 10 * 1024 * 1024
    const totalChunkCount = Math.floor(fileSize / chunkSize)

    const ranges: Array<[number, number]> = []

    for (let index = 0; index < totalChunkCount; index++) {
      const start = index * chunkSize
      const isLastChunk = index === totalChunkCount - 1
      const end = isLastChunk ? fileSize - 1 : start + chunkSize - 1
      ranges.push([start, end])
    }

    const resolvedLastChunkSize = ranges[ranges.length - 1][1] - ranges[ranges.length - 1][0] + 1
    if (
      chunkSize < MIN_CHUNK_SIZE
      || chunkSize > MAX_SINGLE_CHUNK_SIZE
      || resolvedLastChunkSize < MIN_CHUNK_SIZE
      || resolvedLastChunkSize > 128 * 1024 * 1024
      || totalChunkCount > 1000
    ) {
      throw TikTokPlatformException.fromPlatformError({
        code: ResponseCode.ChannelPlatformApiFailed,
        category: PlatformErrorCategory.Unknown,
        context: { endpoint: 'getUploadPlan' },
        platformCode: 'invalid_chunk_plan',
      })
    }

    return {
      chunkSize,
      totalChunkCount,
      ranges,
    }
  }
}
