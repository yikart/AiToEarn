import type { AxiosError, AxiosInstance } from 'axios'
import type { DouyinPlatformResponseBody } from './douyin.exception'
import type {
  DouyinApiRequestBody,
  DouyinApiResponse,
  DouyinClientTokenResponse,
  DouyinOAuthEnvelope,
  DouyinOAuthResponse,
  DouyinOpenTicketResponse,
  DouyinShareIdEnvelope,
  DouyinSharePublishResult,
  DouyinSharePublishResultEnvelope,
  DouyinShareSchemaOptions,
  DouyinUserInfo,
  DouyinVideoCreateRequestBody,
  DouyinVideoCreateResponse,
  DouyinVideoUploadResponse,
} from './douyin.interface'
import { createHash, randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { ServerRedisService } from '../../../../common/redis'
import { DouyinConfig } from './douyin.config'
import { DouyinPlatformException } from './douyin.exception'
import { DouyinOAuthGrantType } from './douyin.interface'

const TOKEN_EXPIRE_BUFFER_MS = 60 * 1000

interface DouyinClientTokenCache {
  access_token: string
  expires_in?: number
  expiresAt?: number
}

interface DouyinOpenTicketCache {
  ticket: string
  clientToken: string
  expires_in?: number
  expiresAt?: number
}

@Injectable()
export class DouyinService {
  private readonly apiBaseUrl = 'https://open.douyin.com'
  private readonly authUrl = 'https://open.douyin.com/platform/oauth/connect/'
  private readonly http: AxiosInstance
  private clientTokenCache?: { accessToken: string, expiresAt: number }
  private openTicketCache?: { clientToken: string, ticket: string, expiresAt: number }

  constructor(
    private readonly cfg: DouyinConfig,
    private readonly redis: ServerRedisService,
  ) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create({ baseURL: this.apiBaseUrl })
    http.interceptors.response.use(
      (response) => {
        if (DouyinPlatformException.hasPlatformError(response)) {
          throw DouyinPlatformException.fromPlatformResponse(response)
        }
        return response
      },
      (error: AxiosError<DouyinPlatformResponseBody>) => {
        throw DouyinPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  private async apiRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    params: Record<string, string> = {},
    body?: DouyinApiRequestBody,
    accessToken?: string,
  ): Promise<T> {
    const headers = {
      ...(accessToken ? { 'access-token': accessToken } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    }

    const response = await this.http.request<DouyinApiResponse<T>>({
      method,
      url: path,
      params,
      data: body,
      headers,
    })

    return response.data.data
  }

  private async oauthRequest<T>(
    path: string,
    data: Record<string, string>,
  ): Promise<T> {
    const response = await this.http.post<DouyinOAuthEnvelope<T>>(path, new URLSearchParams(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data.data
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_key: this.cfg.clientId,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: this.cfg.redirectUri,
      state,
    })

    return `${this.authUrl}?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
    openId: string
    scope: string
  }> {
    const result = await this.oauthRequest<DouyinOAuthResponse>(
      '/oauth/access_token/',
      {
        client_key: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        code,
        grant_type: DouyinOAuthGrantType.AuthorizationCode,
      },
    )

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(Date.now() + Number(result.expires_in) * 1000),
      refreshExpiresAt: new Date(Date.now() + Number(result.refresh_expires_in) * 1000),
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
    const result = await this.oauthRequest<DouyinOAuthResponse>(
      '/oauth/refresh_token/',
      {
        client_key: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        grant_type: DouyinOAuthGrantType.RefreshToken,
        refresh_token: refreshToken,
      },
    )

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(Date.now() + Number(result.expires_in) * 1000),
      refreshExpiresAt: new Date(Date.now() + Number(result.refresh_expires_in) * 1000),
      scope: result.scope,
    }
  }

  async renewRefreshToken(refreshToken: string): Promise<{
    refreshToken: string
    refreshExpiresAt: Date
  }> {
    const result = await this.oauthRequest<{
      refresh_token: string
      expires_in: number | string
    }>(
      '/oauth/renew_refresh_token/',
      {
        client_key: this.cfg.clientId,
        refresh_token: refreshToken,
      },
    )

    return {
      refreshToken: result.refresh_token,
      refreshExpiresAt: new Date(Date.now() + Number(result.expires_in) * 1000),
    }
  }

  async revokeAccessToken(accessToken: string, openId: string): Promise<void> {
    await this.apiRequest<Record<string, never>>(
      'POST',
      '/oauth/revoke/',
      {},
      { open_id: openId },
      accessToken,
    )
  }

  async getUserInfo(accessToken: string, openId: string): Promise<{
    openId: string
    unionId?: string
    nickname?: string
    avatar?: string
    city?: string
    province?: string
    country?: string
    eAccountRole?: string
  }> {
    const result = await this.apiRequest<{ user: DouyinUserInfo }>(
      'POST',
      '/oauth/userinfo/',
      {},
      { open_id: openId },
      accessToken,
    )

    const user = result.user
    return {
      openId: user.open_id,
      unionId: user.union_id,
      nickname: user.nickname,
      avatar: user.avatar,
      city: user.city,
      province: user.province,
      country: user.country,
      eAccountRole: user.e_account_role,
    }
  }

  async getShareid(): Promise<string> {
    const response = await this.requestShareId<DouyinShareIdEnvelope>({
      need_callback: true,
      default_hashtag: 'hashtag',
    })
    const shareId = response.data.data?.share_id
    if (!shareId) {
      throw new AppException(ResponseCode.ChannelPlatformApiFailed, { platform: AccountType.Douyin, field: 'share_id', reasonCode: 'missing_platform_field' })
    }

    return shareId
  }

  async getSharePublishResult(shareId: string): Promise<DouyinSharePublishResult> {
    const response = await this.requestShareId<DouyinSharePublishResultEnvelope>({
      share_id: shareId,
    })
    const data = response.data.data ?? {}

    return {
      shareId: data.share_id ?? shareId,
      itemId: data.item_id,
      videoId: data.video_id,
      shareUrl: data.share_url,
      raw: data,
    }
  }

  async generateShareSchema(options: DouyinShareSchemaOptions): Promise<string> {
    const ticket = await this.getOpenTicket()
    const nonceStr = this.generateNonceStr(32)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = this.generateSignature(ticket, nonceStr, timestamp)

    const url = new URL('snssdk1128://openplatform/share')
    const query = url.searchParams
    query.append('client_key', this.cfg.clientId)
    if (options.shareId) {
      query.append('state', options.shareId)
    }
    query.append('nonce_str', nonceStr)
    query.append('timestamp', timestamp)
    query.append('signature', signature)
    query.append('share_type', 'h5')

    if (options.title) {
      query.append('title', options.title)
    }
    if (options.short_title) {
      query.append('short_title', options.short_title)
    }
    if (options.video_path) {
      query.append('video_path', options.video_path)
      query.append('share_to_publish', '1')
    }
    if (options.image_list_path?.length) {
      query.append('image_list_path', JSON.stringify(options.image_list_path))
    }
    if (options.title_hashtag_list?.length) {
      query.append('title_hashtag_list', JSON.stringify(options.title_hashtag_list))
    }
    if (options.download_type) {
      query.append('download_type', String(options.download_type))
    }
    if (options.private_status !== undefined) {
      query.append('private_status', String(options.private_status))
    }

    return url.toString().replace(/\+/g, '%20')
  }

  private async requestShareId<T>(params: Record<string, string | boolean>) {
    const clientToken = await this.getClientToken()
    try {
      return await this.postShareId<T>(params, clientToken)
    }
    catch (error) {
      if (!this.isClientTokenStaleError(error)) {
        throw error
      }

      await this.clearAppCredentialCache()
      const refreshedClientToken = await this.getClientToken()
      return this.postShareId<T>(params, refreshedClientToken)
    }
  }

  private async postShareId<T>(params: Record<string, string | boolean>, clientToken: string) {
    return this.http.post<T>(
      '/share-id/',
      undefined,
      {
        params,
        headers: {
          'Content-Type': 'application/json',
          'access-token': clientToken,
        },
      },
    )
  }

  private async getClientToken(): Promise<string> {
    const now = Date.now()
    if (this.clientTokenCache && this.clientTokenCache.expiresAt - now > TOKEN_EXPIRE_BUFFER_MS) {
      return this.clientTokenCache.accessToken
    }

    const cached = await this.redis.getDouyinClientToken<DouyinClientTokenCache>()
    if (cached?.access_token) {
      if (cached.expiresAt === undefined || cached.expiresAt - now > TOKEN_EXPIRE_BUFFER_MS) {
        if (cached.expiresAt !== undefined) {
          this.clientTokenCache = {
            accessToken: cached.access_token,
            expiresAt: cached.expiresAt,
          }
        }
        return cached.access_token
      }
    }

    const response = await this.http.post<DouyinOAuthEnvelope<DouyinClientTokenResponse>>(
      '/oauth/client_token/',
      {
        grant_type: DouyinOAuthGrantType.ClientCredential,
        client_key: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const result = response.data.data
    if (!result?.access_token) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { platform: AccountType.Douyin, field: 'access_token', reasonCode: 'missing_platform_field' })
    }
    const expiresIn = Number(result.expires_in)
    const expiresAt = now + expiresIn * 1000

    this.clientTokenCache = {
      accessToken: result.access_token,
      expiresAt,
    }
    await this.redis.saveDouyinClientToken({
      access_token: result.access_token,
      expires_in: expiresIn,
      expiresAt,
    })
    return result.access_token
  }

  private async getOpenTicket(): Promise<string> {
    const clientToken = await this.getClientToken()
    const now = Date.now()
    if (
      this.openTicketCache
      && this.openTicketCache.clientToken === clientToken
      && this.openTicketCache.expiresAt - now > TOKEN_EXPIRE_BUFFER_MS
    ) {
      return this.openTicketCache.ticket
    }

    const cached = await this.redis.getDouyinOpenTicket<DouyinOpenTicketCache>()
    if (
      cached?.ticket
      && cached.clientToken === clientToken
      && (cached.expiresAt === undefined || cached.expiresAt - now > TOKEN_EXPIRE_BUFFER_MS)
    ) {
      if (cached.expiresAt !== undefined) {
        this.openTicketCache = {
          clientToken,
          ticket: cached.ticket,
          expiresAt: cached.expiresAt,
        }
      }
      return cached.ticket
    }

    const response = await this.http.get<DouyinApiResponse<DouyinOpenTicketResponse>>(
      '/open/getticket/',
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': clientToken,
        },
      },
    )
    const result = response.data.data
    if (!result?.ticket) {
      throw new AppException(ResponseCode.ChannelPlatformApiFailed, { platform: AccountType.Douyin, field: 'ticket', reasonCode: 'missing_platform_field' })
    }
    const expiresIn = Number(result.expires_in)
    const expiresAt = now + expiresIn * 1000

    this.openTicketCache = {
      clientToken,
      ticket: result.ticket,
      expiresAt,
    }
    await this.redis.saveDouyinOpenTicket({
      ticket: result.ticket,
      clientToken,
      expires_in: expiresIn,
      expiresAt,
    })
    return result.ticket
  }

  private async clearAppCredentialCache(): Promise<void> {
    this.clientTokenCache = undefined
    this.openTicketCache = undefined
    await this.redis.deleteDouyinClientToken()
    await this.redis.deleteDouyinOpenTicket()
  }

  private isClientTokenStaleError(error: unknown): boolean {
    if (!(error instanceof DouyinPlatformException)) {
      return false
    }
    return ['10008', '2190008', '28001003', '28001008'].includes(String(error.platformCause?.platformCode))
  }

  private generateNonceStr(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }

  private generateSignature(ticket: string, nonceStr: string, timestamp: string): string {
    const signStr = `nonce_str=${nonceStr}&ticket=${ticket}&timestamp=${timestamp}`
    return createHash('md5').update(signStr).digest('hex')
  }

  async uploadVideo(
    accessToken: string,
    openId: string,
    videoBuffer: Buffer,
    filename: string,
  ): Promise<{ videoId: string }> {
    const formData = new FormData()
    formData.append('video', new Blob([new Uint8Array(videoBuffer)]), filename)

    const response = await this.http.post<DouyinApiResponse<DouyinVideoUploadResponse>>(
      '/api/douyin/v1/video/upload_video/',
      formData,
      {
        params: { open_id: openId },
        headers: { 'access-token': accessToken },
      },
    )
    const videoId = response.data.data.video?.video_id
    if (!videoId) {
      throw new AppException(ResponseCode.ChannelPlatformMediaProcessingFailed, { platform: AccountType.Douyin, field: 'video_id', reasonCode: 'missing_platform_field' })
    }

    return { videoId }
  }

  async uploadImage(
    accessToken: string,
    openId: string,
    imageBuffer: Buffer,
    filename: string,
  ): Promise<{ imageId: string }> {
    const formData = new FormData()
    formData.append('image', new Blob([new Uint8Array(imageBuffer)]), filename)

    const response = await this.http.post<DouyinApiResponse<{ image?: { image_id?: string } }>>(
      '/api/douyin/v1/video/upload_image/',
      formData,
      {
        headers: { 'access-token': accessToken },
        params: { open_id: openId },
      },
    )
    const imageId = response.data.data.image?.image_id
    if (!imageId) {
      throw new AppException(ResponseCode.ChannelPlatformMediaProcessingFailed, { platform: AccountType.Douyin, field: 'image_id', reasonCode: 'missing_platform_field' })
    }

    return { imageId }
  }

  async createVideo(
    accessToken: string,
    openId: string,
    params: {
      videoId: string
      title?: string
      description?: string
      customCoverImageId?: string
      coverTsp?: number
      downloadType?: number
      privateStatus?: number
      topics?: string[]
    },
  ): Promise<DouyinVideoCreateResponse> {
    const textParts = [
      params.title,
      params.description,
      ...(params.topics ?? []).map(topic => `#${topic.replace(/^#/, '')}`),
    ].filter(Boolean)

    const body: DouyinVideoCreateRequestBody = {
      video_id: params.videoId,
      text: textParts.join('\n').trim(),
      custom_cover_image_url: params.customCoverImageId,
      cover_tsp: params.coverTsp,
      download_type: params.downloadType,
      private_status: params.privateStatus,
    }

    return this.apiRequest<DouyinVideoCreateResponse>(
      'POST',
      '/api/douyin/v1/video/create_video/',
      { open_id: openId },
      body,
      accessToken,
    )
  }
}
