import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import { createHash } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { z } from 'zod'
import { categoryFromHttpStatus, isHttpStatusRetryable, isNetworkErrorCode } from '../../utils/platform-error-classifier.util'
import { categoryFromWeChatErrCode, isWeChatErrCodeRetryable } from '../../utils/wechat-error.util'
import { isAvailablePlatformConfig } from '../platforms.config'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { WechatChannelsConfig, WechatConfig, WechatOfficialConfig } from './wechat.config'

interface WeChatApiErrorResponse {
  errcode?: number
  errmsg?: string
}

interface WeChatEndpointConfig {
  url?: string
  method?: string
  baseURL?: string
}

interface WeChatAccessTokenResponse {
  access_token: string
  expires_in: number
  errcode?: number
  errmsg?: string
}

export interface WeChatChannelsFinderVideoInfo {
  errcode?: number
  errmsg?: string
  finder_id?: string
  video_id?: string
  title?: string
  description?: string
  cover_url?: string
  publish_time?: number | string
  create_time?: number | string
  read_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

export interface WeChatChannelsLinkInfo {
  errcode?: number
  errmsg?: string
  finder_id?: string
  video_id?: string
}

interface WeChatUserInfoResponse {
  openid: string
  nickname: string
  headimgurl?: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

interface WeChatJsapiTicketResponse {
  ticket: string
  expires_in: number
  errcode?: number
  errmsg?: string
}

interface WeChatDraftAddResponse {
  media_id: string
  errcode?: number
  errmsg?: string
}

interface WeChatFreePublishResponse {
  publish_id: string
  errcode?: number
  errmsg?: string
}

interface WeChatMediaUploadResponse {
  media_id: string
  url?: string
  errcode?: number
  errmsg?: string
}

interface WeChatMaterialCountResponse {
  voice_count: number
  video_count: number
  image_count: number
  news_count: number
  errcode?: number
  errmsg?: string
}

interface WeChatUserCumulateItem {
  ref_date?: string
  cumulate_user?: number
}

interface WeChatUserCumulateResponse {
  errcode?: number
  errmsg?: string
  list?: WeChatUserCumulateItem[]
}

interface WeChatUserReadItem {
  ref_date?: string
  user_source?: number
  int_page_read_user?: number
  int_page_read_count?: number
  ori_page_read_user?: number
  ori_page_read_count?: number
  share_user?: number
  share_count?: number
  add_to_fav_user?: number
  add_to_fav_count?: number
}

interface WeChatUserReadResponse {
  errcode?: number
  errmsg?: string
  list?: WeChatUserReadItem[]
}

interface WeChatChannelsUserAttr {
  nickname?: string
  username?: string
  encryptedUsername?: string
  encryptedHeadImage?: string
  city?: string
  province?: string
  country?: string
  sex?: number
}

interface WeChatChannelsFinderUser {
  finderUsername?: string
  nickname?: string
  headImgUrl?: string
  coverImgUrl?: string
  acctType?: number
  authIconType?: number
  adminNickname?: string
  feedsCount?: number | string
  fansCount?: number | string
  uniqId?: string
  isMasterFinder?: boolean
}

interface WeChatChannelsAuthDataPayload {
  userAttr?: WeChatChannelsUserAttr
  finderUser?: WeChatChannelsFinderUser
}

interface WeChatChannelsAuthDataResponse {
  errCode?: number
  errMsg?: string
  errcode?: number
  errmsg?: string
  err_code?: number
  err_msg?: string
  code?: number
  message?: string
  base_resp?: {
    ret?: number
    err_msg?: string
  }
  data?: WeChatChannelsAuthDataPayload
}

interface BrowserCookieItem {
  name?: string
  value?: string
}

const WeChatChannelsUserAttrSchema = z.object({
  nickname: z.string().optional(),
  username: z.string().optional(),
  encryptedUsername: z.string().optional(),
  encryptedHeadImage: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  sex: z.number().optional(),
})

const WeChatChannelsFinderUserSchema = z.object({
  finderUsername: z.string().optional(),
  nickname: z.string().optional(),
  headImgUrl: z.string().optional(),
  coverImgUrl: z.string().optional(),
  acctType: z.number().optional(),
  authIconType: z.number().optional(),
  adminNickname: z.string().optional(),
  feedsCount: z.union([z.number(), z.string()]).optional(),
  fansCount: z.union([z.number(), z.string()]).optional(),
  uniqId: z.string().optional(),
  isMasterFinder: z.boolean().optional(),
})

const WeChatChannelsAuthDataResponseSchema = z.object({
  errCode: z.number().optional(),
  errMsg: z.string().optional(),
  errcode: z.number().optional(),
  errmsg: z.string().optional(),
  err_code: z.number().optional(),
  err_msg: z.string().optional(),
  code: z.number().optional(),
  message: z.string().optional(),
  base_resp: z.object({
    ret: z.number().optional(),
    err_msg: z.string().optional(),
  }).optional(),
  data: z.object({
    userAttr: WeChatChannelsUserAttrSchema.optional(),
    finderUser: WeChatChannelsFinderUserSchema.optional(),
  }).optional(),
})

export interface WeChatChannelsAuthData {
  uid?: string
  nickname?: string
  avatar?: string
  fansCount?: number
  followingCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  workCount?: number
  raw: WeChatChannelsAuthDataResponse
}

export interface WeChatArticle {
  article_type?: 'news'
  title: string
  author?: string
  digest?: string
  content: string
  thumb_media_id: string
  show_cover_pic?: number
  thumb_url?: string
  need_open_comment?: number
  only_fans_can_comment?: number
  content_source_url?: string
}

@Injectable()
export class WeChatService {
  private readonly logger = new Logger(WeChatService.name)
  private readonly httpClient: AxiosInstance
  private officialAccessTokenCache: { token: string, expiresAt: number } | null = null
  private channelsAccessTokenCache: { token: string, expiresAt: number } | null = null

  constructor(private readonly cfg: WechatConfig) {
    this.httpClient = axios.create({ timeout: 30000 })
    this.httpClient.interceptors.response.use(
      (response) => {
        this.throwIfWeChatApiError(response)
        return response
      },
      (error: AxiosError<WeChatApiErrorResponse>) => {
        throw this.fromAxiosError(error)
      },
    )
  }

  private get officialConfig(): WechatOfficialConfig {
    if (!isAvailablePlatformConfig(this.cfg.official)) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform: AccountType.WeChatOfficial })
    }
    return this.cfg.official
  }

  private get channelsConfig(): WechatChannelsConfig {
    if (!isAvailablePlatformConfig(this.cfg.channels)) {
      throw new AppException(ResponseCode.PlatformNotSupported, { platform: AccountType.WeChatChannels })
    }
    return this.cfg.channels
  }

  // ── Official Account OAuth2 ──

  generateOfficialAuthUrl(redirectUri: string, state: string, scope: string): string {
    const params = new URLSearchParams({
      appid: this.officialConfig.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
    })
    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`
  }

  async exchangeOfficialCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    openId: string
    unionId?: string
    scope: string
  }> {
    const params = new URLSearchParams({
      appid: this.officialConfig.appId,
      secret: this.officialConfig.appSecret,
      code,
      grant_type: 'authorization_code',
    })

    const response = await this.httpClient.get<{
      access_token: string
      refresh_token: string
      expires_in: number
      openid: string
      unionid?: string
      scope: string
      errcode?: number
      errmsg?: string
    }>(`https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`)

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      openId: response.data.openid,
      unionId: response.data.unionid,
      scope: response.data.scope,
    }
  }

  async refreshOfficialToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    scope: string
  }> {
    const params = new URLSearchParams({
      appid: this.officialConfig.appId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await this.httpClient.get<{
      access_token: string
      refresh_token: string
      expires_in: number
      scope: string
      errcode?: number
      errmsg?: string
    }>(`https://api.weixin.qq.com/sns/oauth2/refresh_token?${params.toString()}`)

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      scope: response.data.scope,
    }
  }

  async getOfficialUserInfo(accessToken: string, openId: string): Promise<{
    openId: string
    nickname: string
    avatarUrl?: string
    unionId?: string
  }> {
    const params = new URLSearchParams({
      access_token: accessToken,
      openid: openId,
      lang: 'zh_CN',
    })

    const response = await this.httpClient.get<WeChatUserInfoResponse>(
      `https://api.weixin.qq.com/sns/userinfo?${params.toString()}`,
    )

    return {
      openId: response.data.openid,
      nickname: response.data.nickname,
      avatarUrl: response.data.headimgurl,
      unionId: response.data.unionid,
    }
  }

  // ── Official Account API (server-side token) ──

  async getOfficialAccessToken(): Promise<string> {
    const now = Date.now()
    if (this.officialAccessTokenCache && this.officialAccessTokenCache.expiresAt > now) {
      return this.officialAccessTokenCache.token
    }

    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: this.officialConfig.appId,
      secret: this.officialConfig.appSecret,
    })

    const response = await this.httpClient.get<WeChatAccessTokenResponse>(
      `https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`,
    )

    this.officialAccessTokenCache = {
      token: response.data.access_token,
      expiresAt: now + (response.data.expires_in - 300) * 1000,
    }

    return response.data.access_token
  }

  async addDraft(articles: WeChatArticle[]): Promise<string> {
    const accessToken = await this.getOfficialAccessToken()

    const response = await this.httpClient.post<WeChatDraftAddResponse>(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
      { articles },
    )

    return response.data.media_id
  }

  async freePublish(mediaId: string): Promise<string> {
    const accessToken = await this.getOfficialAccessToken()

    const response = await this.httpClient.post<WeChatFreePublishResponse>(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
      { media_id: mediaId },
    )

    return response.data.publish_id
  }

  async getPublishStatus(publishId: string): Promise<{
    publishStatus: number
    articleId?: string
    articleUrl?: string
  }> {
    const accessToken = await this.getOfficialAccessToken()

    const response = await this.httpClient.post<{
      publish_id: string
      publish_status: number
      article_id?: string
      article_url?: string
      errcode?: number
      errmsg?: string
    }>(`https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${accessToken}`, {
      publish_id: publishId,
    })

    return {
      publishStatus: response.data.publish_status,
      articleId: response.data.article_id,
      articleUrl: response.data.article_url,
    }
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const accessToken = await this.getOfficialAccessToken()
    const formData = new FormData()
    formData.append('media', new Blob([new Uint8Array(imageBuffer)]), filename)

    const response = await this.httpClient.post<WeChatMediaUploadResponse>(
      `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    if (!response.data.url) {
      throw new ChannelPlatformException({
        code: ResponseCode.ChannelPlatformMediaProcessingFailed,
        platform: AccountType.WeChatOfficial,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'uploadImage' },
        cause: {
          type: PlatformErrorCauseType.Validation,
          platformMessage: 'Missing image url in uploadImage response',
          raw: response.data,
        },
      })
    }

    return response.data.url
  }

  async uploadThumbImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const accessToken = await this.getOfficialAccessToken()
    const formData = new FormData()
    formData.append('media', new Blob([new Uint8Array(imageBuffer)]), filename)

    const response = await this.httpClient.post<WeChatMediaUploadResponse>(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    return response.data.media_id
  }

  async getMaterialCount(): Promise<WeChatMaterialCountResponse> {
    const accessToken = await this.getOfficialAccessToken()

    const response = await this.httpClient.get<WeChatMaterialCountResponse>(
      `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${accessToken}`,
    )

    return response.data
  }

  async getUserCumulate(
    accessToken: string,
    beginDate: string,
    endDate: string,
  ): Promise<WeChatUserCumulateResponse> {
    const response = await this.httpClient.post<WeChatUserCumulateResponse>(
      `https://api.weixin.qq.com/datacube/getusercumulate?access_token=${accessToken}`,
      {
        begin_date: beginDate,
        end_date: endDate,
      },
    )
    return response.data
  }

  async getUserRead(
    accessToken: string,
    beginDate: string,
    endDate: string,
  ): Promise<WeChatUserReadResponse> {
    const response = await this.httpClient.post<WeChatUserReadResponse>(
      `https://api.weixin.qq.com/datacube/getuserread?access_token=${accessToken}`,
      {
        begin_date: beginDate,
        end_date: endDate,
      },
    )
    return response.data
  }

  async getJsapiTicket(): Promise<string> {
    const accessToken = await this.getOfficialAccessToken()

    const response = await this.httpClient.get<WeChatJsapiTicketResponse>(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`,
    )

    return response.data.ticket
  }

  // ── Channels (视频号) API ──

  async getChannelsAccessToken(): Promise<string> {
    const now = Date.now()
    if (this.channelsAccessTokenCache && this.channelsAccessTokenCache.expiresAt > now) {
      return this.channelsAccessTokenCache.token
    }

    const response = await this.httpClient.post<WeChatAccessTokenResponse>(
      'https://api.weixin.qq.com/cgi-bin/token',
      {
        grant_type: 'client_credential',
        appid: this.channelsConfig.appId,
        secret: this.channelsConfig.appSecret,
      },
    )

    this.channelsAccessTokenCache = {
      token: response.data.access_token,
      expiresAt: now + (response.data.expires_in - 300) * 1000,
    }

    return response.data.access_token
  }

  async channelsGetFinderVideoInfo(finderId: string, videoId: string): Promise<WeChatChannelsFinderVideoInfo> {
    const accessToken = await this.getChannelsAccessToken()

    const response = await this.httpClient.post<WeChatChannelsFinderVideoInfo>(
      `https://api.weixin.qq.com/channels/ec/finder/video/get?access_token=${accessToken}`,
      { finder_id: finderId, video_id: videoId },
    )

    return response.data
  }

  async channelsCreateVideoDraft(params: {
    title: string
    description?: string
    videoMediaId: string
    coverMediaId?: string
  }): Promise<string> {
    const accessToken = await this.getChannelsAccessToken()

    const response = await this.httpClient.post<{
      errcode?: number
      errmsg?: string
      media_id?: string
    }>(
      `https://api.weixin.qq.com/channels/medias/uploadvideo?access_token=${accessToken}`,
      {
        title: params.title,
        description: params.description ?? '',
        media_id: params.videoMediaId,
        cover_media_id: params.coverMediaId,
      },
    )

    return response.data.media_id ?? ''
  }

  async channelsPublishVideo(mediaId: string): Promise<string> {
    const accessToken = await this.getChannelsAccessToken()

    const response = await this.httpClient.post<{
      errcode?: number
      errmsg?: string
      publish_id?: string
    }>(
      `https://api.weixin.qq.com/channels/medias/publish?access_token=${accessToken}`,
      { media_id: mediaId },
    )

    return response.data.publish_id ?? ''
  }

  async channelsGetPublishStatus(publishId: string): Promise<{
    status: number
    videoId?: string
    finderId?: string
  }> {
    const accessToken = await this.getChannelsAccessToken()

    const response = await this.httpClient.post<{
      errcode?: number
      errmsg?: string
      status?: number
      video_id?: string
      finder_id?: string
    }>(
      `https://api.weixin.qq.com/channels/medias/publish/status?access_token=${accessToken}`,
      { publish_id: publishId },
    )

    return {
      status: response.data.status ?? 0,
      videoId: response.data.video_id,
      finderId: response.data.finder_id,
    }
  }

  async channelsUploadVideo(videoBuffer: Buffer, filename: string): Promise<string> {
    const accessToken = await this.getChannelsAccessToken()
    const formData = new FormData()
    formData.append('media', new Blob([new Uint8Array(videoBuffer)]), filename)

    const response = await this.httpClient.post<{
      errcode?: number
      errmsg?: string
      media_id?: string
    }>(
      `https://api.weixin.qq.com/channels/medias/upload?access_token=${accessToken}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    return response.data.media_id ?? ''
  }

  async channelsUploadCover(imageBuffer: Buffer, filename: string): Promise<string> {
    const accessToken = await this.getChannelsAccessToken()
    const formData = new FormData()
    formData.append('media', new Blob([new Uint8Array(imageBuffer)]), filename)

    const response = await this.httpClient.post<{
      errcode?: number
      errmsg?: string
      media_id?: string
    }>(
      `https://api.weixin.qq.com/channels/medias/upload?access_token=${accessToken}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    return response.data.media_id ?? ''
  }

  async channelsGetLinkInfo(link: string): Promise<WeChatChannelsLinkInfo> {
    const accessToken = await this.getChannelsAccessToken()

    const response = await this.httpClient.post<WeChatChannelsLinkInfo>(
      `https://api.weixin.qq.com/channels/ec/finder/link/info?access_token=${accessToken}`,
      { link },
    )

    return response.data
  }

  async getChannelsAuthData(loginCookie: string): Promise<WeChatChannelsAuthData> {
    const cookie = this.buildCookieHeader(loginCookie)
    const cookieMap = this.parseCookieHeader(cookie)
    if (!cookieMap['sessionid']) {
      throw new ChannelPlatformException({
        code: ResponseCode.ChannelAccountInfoFailed,
        platform: AccountType.WeChatChannels,
        category: PlatformErrorCategory.Auth,
        context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
        cause: {
          type: PlatformErrorCauseType.Validation,
          platformMessage: 'Missing sessionid in WeChat Channels loginCookie',
        },
        retryable: false,
      })
    }

    let data: WeChatChannelsAuthDataResponse
    const requestBody = {
      timestamp: String(Date.now()),
      _log_finder_uin: '',
      _log_finder_id: '',
      rawKeyBuff: null,
      pluginSessionId: null,
      scene: 7,
      reqScene: 7,
    }
    const params = {
      _aid: this.buildChannelsRequestHash(cookie),
      _rid: this.buildChannelsRequestHash(`${cookie}:${Date.now()}`),
      _pageUrl: 'https://channels.weixin.qq.com/platform',
    }
    try {
      const response = await axios.post<WeChatChannelsAuthDataResponse>(
        'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data',
        requestBody,
        {
          timeout: 30000,
          params,
          headers: {
            'Origin': 'https://channels.weixin.qq.com',
            'Referer': 'https://channels.weixin.qq.com/platform',
            'Cookie': cookie,
            ...(cookieMap['wxuin'] && { 'X-WECHAT-UIN': cookieMap['wxuin'] }),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': 'channels.weixin.qq.com',
          },
        },
      )
      data = this.parseChannelsAuthDataResponse(response.data)
    }
    catch (error) {
      this.logger.error(error, 'WeChat Channels auth_data request failed')
      if (error instanceof ChannelPlatformException) {
        throw error
      }
      if (axios.isAxiosError<WeChatChannelsAuthDataResponse>(error) || error instanceof Error) {
        throw this.fromChannelsAuthDataError(error)
      }
      throw this.fromChannelsAuthDataUnexpectedError()
    }

    this.throwIfChannelsAuthDataError(data)
    return this.parseChannelsAuthData(data)
  }

  // ── Helpers ──

  private parseChannelsAuthDataResponse(data: unknown): WeChatChannelsAuthDataResponse {
    const parsed = WeChatChannelsAuthDataResponseSchema.safeParse(data)
    if (parsed.success) {
      return parsed.data
    }

    throw new ChannelPlatformException({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      platform: AccountType.WeChatChannels,
      category: PlatformErrorCategory.Validation,
      context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformMessage: 'Invalid WeChat Channels auth_data response',
        raw: { issues: parsed.error.issues, data },
      },
      retryable: false,
    })
  }

  private parseChannelsAuthData(data: WeChatChannelsAuthDataResponse): WeChatChannelsAuthData {
    const finderUser = data.data?.finderUser
    const userAttr = data.data?.userAttr
    const uid = finderUser?.uniqId

    return {
      uid,
      nickname: finderUser?.nickname ?? userAttr?.nickname ?? uid,
      avatar: finderUser?.headImgUrl ?? userAttr?.encryptedHeadImage,
      fansCount: this.toCount(finderUser?.fansCount),
      workCount: this.toCount(finderUser?.feedsCount),
      raw: data,
    }
  }

  private throwIfChannelsAuthDataError(data: WeChatChannelsAuthDataResponse): void {
    const code = data.errCode ?? data.errcode ?? data.err_code ?? data.code ?? data.base_resp?.ret ?? 0
    if (code === 0) {
      return
    }

    throw new ChannelPlatformException({
      code: ResponseCode.ChannelAccountInfoFailed,
      platform: AccountType.WeChatChannels,
      category: categoryFromWeChatErrCode(code),
      context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
      cause: {
        type: PlatformErrorCauseType.Platform,
        platformCode: code,
        platformMessage: data.errMsg ?? data.errmsg ?? data.err_msg ?? data.message ?? data.base_resp?.err_msg ?? 'Unknown error',
        raw: data,
      },
      retryable: isWeChatErrCodeRetryable(code),
    })
  }

  private fromChannelsAuthDataError(error: Error | AxiosError<WeChatChannelsAuthDataResponse>): ChannelPlatformException {
    if (axios.isAxiosError<WeChatChannelsAuthDataResponse>(error)) {
      const data = error.response?.data
      return new ChannelPlatformException({
        code: ResponseCode.ChannelAccountInfoFailed,
        platform: AccountType.WeChatChannels,
        category: error.response
          ? categoryFromHttpStatus(error.response.status)
          : PlatformErrorCategory.Network,
        context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
        cause: {
          type: error.response
            ? PlatformErrorCauseType.Http
            : (isNetworkErrorCode(error.code) ? PlatformErrorCauseType.Network : PlatformErrorCauseType.Unknown),
          httpStatus: error.response?.status,
          platformCode: data?.errCode ?? data?.errcode ?? data?.err_code ?? data?.code,
          platformMessage: data?.errMsg ?? data?.errmsg ?? data?.err_msg ?? data?.message ?? error.message,
          raw: data ?? { message: error.message, code: error.code },
        },
        retryable: error.response ? isHttpStatusRetryable(error.response.status) : true,
      })
    }

    return new ChannelPlatformException({
      code: ResponseCode.ChannelAccountInfoFailed,
      platform: AccountType.WeChatChannels,
      category: PlatformErrorCategory.Unknown,
      context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
      cause: {
        type: PlatformErrorCauseType.Unknown,
        platformMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      retryable: false,
    })
  }

  private fromChannelsAuthDataUnexpectedError(): ChannelPlatformException {
    return new ChannelPlatformException({
      code: ResponseCode.ChannelAccountInfoFailed,
      platform: AccountType.WeChatChannels,
      category: PlatformErrorCategory.Unknown,
      context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
      cause: {
        type: PlatformErrorCauseType.Unknown,
        platformMessage: 'Unexpected auth_data error',
      },
      retryable: false,
    })
  }

  private buildCookieHeader(loginCookie: string): string {
    const raw = this.sanitizeCookieHeaderValue(loginCookie.trim(), 'loginCookie')
    if (!raw.startsWith('[')) {
      return raw
    }

    try {
      const cookies = JSON.parse(raw) as BrowserCookieItem[]
      if (!Array.isArray(cookies)) {
        return raw
      }

      return cookies
        .map((cookie) => {
          if (!cookie || typeof cookie.name !== 'string' || typeof cookie.value !== 'string') {
            return ''
          }
          const name = this.sanitizeCookieHeaderValue(cookie.name, 'cookie.name').trim()
          const value = this.sanitizeCookieHeaderValue(cookie.value, 'cookie.value').trim()
          return `${name}=${value}`
        })
        .filter(Boolean)
        .join('; ')
    }
    catch {
      return raw
    }
  }

  private sanitizeCookieHeaderValue(value: string, field: string): string {
    if (/[\r\n]/.test(value)) {
      throw new ChannelPlatformException({
        code: ResponseCode.ChannelAccountInfoFailed,
        platform: AccountType.WeChatChannels,
        category: PlatformErrorCategory.Validation,
        context: { endpoint: 'POST /cgi-bin/mmfinderassistant-bin/auth/auth_data' },
        cause: {
          type: PlatformErrorCauseType.Validation,
          platformMessage: `Invalid newline in WeChat Channels ${field}`,
        },
        retryable: false,
      })
    }
    return value
  }

  private parseCookieHeader(cookie: string): Record<string, string> {
    return cookie
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((result, item) => {
        const separatorIndex = item.indexOf('=')
        if (separatorIndex <= 0) {
          return result
        }
        result[item.slice(0, separatorIndex).trim()] = item.slice(separatorIndex + 1).trim()
        return result
      }, {})
  }

  private buildChannelsRequestHash(cookie: string): string {
    return createHash('md5').update(cookie).digest('hex')
  }

  private toCount(value?: number | string): number | undefined {
    if (value === undefined || value === '') {
      return undefined
    }
    return Number(value)
  }

  private throwIfWeChatApiError(response: AxiosResponse<WeChatApiErrorResponse>): void {
    const data = response.data
    if (data?.errcode && data.errcode !== 0) {
      const endpoint = this.endpointFromConfig(response.config)
      const exception = new ChannelPlatformException({
        code: this.codeFromEndpoint(endpoint),
        platform: this.platformFromEndpoint(endpoint),
        category: categoryFromWeChatErrCode(data.errcode),
        context: { endpoint },
        cause: {
          type: PlatformErrorCauseType.Platform,
          platformCode: data.errcode,
          platformMessage: data.errmsg ?? 'Unknown error',
          raw: data,
        },
        retryable: isWeChatErrCodeRetryable(data.errcode),
      })
      this.logger.error(exception, `WeChat API error ${endpoint ?? 'unresolved endpoint'}`)
      throw exception
    }
  }

  private fromAxiosError(error: AxiosError<WeChatApiErrorResponse>): ChannelPlatformException {
    const response = error.response
    const data = response?.data
    const endpoint = this.endpointFromConfig(response?.config ?? error.config)

    return new ChannelPlatformException({
      code: this.codeFromEndpoint(endpoint),
      platform: this.platformFromEndpoint(endpoint),
      category: response
        ? categoryFromHttpStatus(response.status)
        : PlatformErrorCategory.Network,
      context: { endpoint },
      cause: {
        type: response
          ? PlatformErrorCauseType.Http
          : (isNetworkErrorCode(error.code) ? PlatformErrorCauseType.Network : PlatformErrorCauseType.Unknown),
        httpStatus: response?.status,
        platformCode: data?.errcode,
        platformMessage: data?.errmsg ?? error.message,
        raw: data ?? error.toJSON(),
      },
      retryable: response ? isHttpStatusRetryable(response.status) : true,
    })
  }

  private endpointFromConfig(config?: WeChatEndpointConfig): string | undefined {
    if (!config?.url) {
      return undefined
    }
    const method = config.method?.toUpperCase()
    const path = this.pathFromUrl(config.url, config.baseURL)
    return method ? `${method} ${path}` : path
  }

  private pathFromUrl(rawUrl: string, baseURL?: string): string {
    try {
      return new URL(rawUrl, baseURL).pathname
    }
    catch {
      return rawUrl.split('?')[0] || rawUrl
    }
  }

  private platformFromEndpoint(endpoint?: string): AccountType.WeChatOfficial | AccountType.WeChatChannels {
    if (endpoint?.includes('/channels/')
      || endpoint === 'POST /cgi-bin/token') {
      return AccountType.WeChatChannels
    }
    return AccountType.WeChatOfficial
  }

  private codeFromEndpoint(endpoint?: string): ResponseCode {
    if (endpoint?.includes('/sns/oauth2/refresh_token')) {
      return ResponseCode.ChannelRefreshTokenFailed
    }
    if (endpoint?.includes('/sns/oauth2/access_token')
      || endpoint?.includes('/cgi-bin/token')) {
      return ResponseCode.ChannelAccessTokenFailed
    }
    if (endpoint?.includes('/cgi-bin/draft/add')
      || endpoint?.includes('/cgi-bin/freepublish/submit')
      || endpoint?.includes('/cgi-bin/media/uploadimg')
      || endpoint?.includes('/cgi-bin/material/add_material')
      || endpoint?.includes('/channels/medias/uploadvideo')
      || endpoint?.includes('/channels/medias/upload')
      || (endpoint?.includes('/channels/medias/publish') && !endpoint.includes('/channels/medias/publish/status'))) {
      return ResponseCode.ChannelPlatformMediaProcessingFailed
    }
    return ResponseCode.ChannelPlatformApiFailed
  }
}
