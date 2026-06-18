import type { AxiosError, AxiosInstance } from 'axios'
import type {
  DouyinMiniAppAccessTokenInfo,
  DouyinMiniAppAccessTokenResponse,
  DouyinMiniAppClientTokenResponse,
  DouyinMiniAppCode2SessionResponse,
  DouyinMiniAppFansRecord,
  DouyinMiniAppFansResponse,
  DouyinMiniAppQrCodeOptions,
  DouyinMiniAppQrCodeResponse,
  DouyinMiniAppSessionInfo,
  DouyinMiniAppVideoIdToOpenItemIdResponse,
  DouyinMiniAppVideoItem,
  DouyinMiniAppVideoQueryExtra,
  DouyinMiniAppVideoQueryResponse,
} from './douyin-miniapp.interface'
import type { DouyinMiniAppConfigValue } from './douyin.config'
import type { DouyinPlatformResponseBody } from './douyin.exception'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { DouyinOAuthGrantType } from './douyin-miniapp.interface'
import { DouyinConfig } from './douyin.config'
import { DouyinPlatformException } from './douyin.exception'

const DOUYIN_MINIAPP_ENDPOINTS = {
  official: {
    clientToken: 'https://open.douyin.com/oauth/client_token/',
    qrCode: 'https://open.douyin.com/api/apps/v1/qrcode/create/',
    code2Session: 'https://developer.toutiao.com/api/apps/v2/jscode2session',
    userAccessToken: 'https://open.douyin.com/oauth/access_token/',
    fansCount: 'https://open.douyin.com/api/apps/v1/user/get_fans/',
    videoQuery: 'https://open.douyin.com/api/apps/v1/video/query/',
    videoIdToOpenItemId: 'https://open.douyin.com/api/apps/v1/convert_video_id/video_id_to_open_item_id/',
  },
  sandbox: {
    clientToken: 'https://open-sandbox.douyin.com/oauth/client_token/',
    qrCode: 'https://open-sandbox.douyin.com/api/apps/v1/qrcode/create/',
    code2Session: 'https://open-sandbox.douyin.com/api/apps/v2/jscode2session',
    userAccessToken: 'https://open-sandbox.douyin.com/oauth/access_token/',
    fansCount: 'https://open-sandbox.douyin.com/api/apps/v1/user/get_fans/',
    videoQuery: 'https://open-sandbox.douyin.com/api/apps/v1/video/query/',
    videoIdToOpenItemId: 'https://open-sandbox.douyin.com/api/apps/v1/convert_video_id/video_id_to_open_item_id/',
  },
}

@Injectable()
export class DouyinMiniAppService {
  private readonly http: AxiosInstance

  constructor(private readonly cfg: DouyinConfig) {
    this.http = this.createHttpClient()
  }

  async createQrCode(options: DouyinMiniAppQrCodeOptions): Promise<string> {
    const accessToken = await this.getClientToken()
    const miniApp = this.miniAppConfig
    const response = await this.http.post<DouyinMiniAppQrCodeResponse>(
      this.endpoints.qrCode,
      {
        app_name: options.appName,
        appid: miniApp.clientId,
        path: options.path,
        width: options.width,
        is_circle_code: options.isCircleCode,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
      },
    )
    const img = response.data.data?.img
    if (!img) {
      throw new AppException(ResponseCode.ChannelPlatformApiFailed, { platform: AccountType.Douyin, field: 'img', reasonCode: 'missing_platform_field' })
    }

    return img
  }

  async code2Session(code: string): Promise<DouyinMiniAppSessionInfo> {
    const miniApp = this.miniAppConfig
    const response = await this.http.post<DouyinMiniAppCode2SessionResponse>(
      this.endpoints.code2Session,
      {
        appid: miniApp.clientId,
        secret: miniApp.clientSecret,
        code,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const data = response.data.data
    if (!data?.openid) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { platform: AccountType.Douyin, field: 'openid', reasonCode: 'missing_platform_field' })
    }

    return {
      openid: data.openid,
      unionid: data.unionid,
      anonymousOpenid: data.anonymous_openid ?? data.anonymousOpenid,
    }
  }

  async getUserAccessToken(ticket: string): Promise<DouyinMiniAppAccessTokenInfo> {
    const miniApp = this.miniAppConfig
    const response = await this.http.post<DouyinMiniAppAccessTokenResponse>(
      this.endpoints.userAccessToken,
      new URLSearchParams({
        client_key: miniApp.clientId,
        client_secret: miniApp.clientSecret,
        code: ticket,
        grant_type: DouyinOAuthGrantType.AuthorizationCode,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    const data = response.data.data
    if (!data?.access_token) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { platform: AccountType.Douyin, field: 'access_token', reasonCode: 'missing_platform_field' })
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: Number(data.expires_in ?? 0),
      refreshExpiresIn: data.refresh_expires_in ? Number(data.refresh_expires_in) : undefined,
      openId: data.open_id,
      scope: data.scope,
    }
  }

  async getFansCount(
    accessToken: string,
    openId: string,
    dateType: 7 | 15 = 7,
  ): Promise<number | undefined> {
    const response = await this.http.get<DouyinMiniAppFansResponse>(
      this.endpoints.fansCount,
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        params: {
          open_id: openId,
          date_type: dateType,
        },
      },
    )

    const data = response.data.data
    return this.pickLatestFansCount(data?.data?.result_list ?? data?.result_list ?? [])
  }

  async getFansData(
    accessToken: string,
    openId: string,
    dateType: 7 | 15 = 7,
  ): Promise<{
    scope: 'ma.user.data'
    dateType: 7 | 15
    fansCount: number | null
    fans: Array<{ date?: string, newFans: number, totalFans: number }>
  }> {
    const response = await this.http.get<DouyinMiniAppFansResponse>(
      this.endpoints.fansCount,
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        params: {
          open_id: openId,
          date_type: dateType,
        },
      },
    )

    const records = response.data.data?.data?.result_list ?? response.data.data?.result_list ?? []
    const fans = records.map(record => ({
      date: record.date,
      newFans: Number(record.new_fans ?? 0),
      totalFans: Number(record.total_fans ?? 0),
    }))
    const latest = fans[fans.length - 1]

    return {
      scope: 'ma.user.data',
      dateType,
      fansCount: latest ? latest.totalFans : null,
      fans,
    }
  }

  async queryVideoData(
    accessToken: string,
    openId: string,
    data: {
      itemIds?: string[]
      videoIds?: string[]
    },
  ): Promise<{ extra?: DouyinMiniAppVideoQueryExtra, list: DouyinMiniAppVideoItem[] }> {
    const response = await this.http.post<DouyinMiniAppVideoQueryResponse>(
      this.endpoints.videoQuery,
      {
        ...(data.itemIds?.length ? { item_ids: data.itemIds } : {}),
        ...(data.videoIds?.length ? { video_ids: data.videoIds } : {}),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
        params: {
          open_id: openId,
        },
      },
    )

    return {
      extra: response.data.data?.extra,
      list: response.data.data?.list ?? [],
    }
  }

  async videoIdToOpenItemId(videoIds: string[]): Promise<Record<string, string>> {
    const miniApp = this.miniAppConfig
    const accessToken = await this.getClientToken()
    const response = await this.http.post<DouyinMiniAppVideoIdToOpenItemIdResponse>(
      this.endpoints.videoIdToOpenItemId,
      {
        access_key: miniApp.clientId,
        app_id: miniApp.clientId,
        video_ids: videoIds,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
        },
      },
    )

    const convertResult = response.data.data?.convert_result
    if (Array.isArray(convertResult)) {
      return Object.fromEntries(convertResult
        .map((item) => {
          const key = item._key ?? item.key ?? item.video_id ?? ''
          const value = item._val ?? item.value ?? item.item_id ?? ''
          return [key, value]
        })
        .filter(([key, value]) => key && value))
    }

    return convertResult ?? {}
  }

  private async getClientToken(): Promise<string> {
    const miniApp = this.miniAppConfig
    const response = await this.http.post<DouyinMiniAppClientTokenResponse>(
      this.endpoints.clientToken,
      {
        client_key: miniApp.clientId,
        client_secret: miniApp.clientSecret,
        grant_type: DouyinOAuthGrantType.ClientCredential,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const token = response.data.data?.access_token
    if (!token) {
      throw new AppException(ResponseCode.ChannelAccessTokenFailed, { platform: AccountType.Douyin, field: 'access_token', reasonCode: 'missing_platform_field' })
    }

    return token
  }

  private pickLatestFansCount(records: DouyinMiniAppFansRecord[]): number | undefined {
    const orderedRecords = [...records].sort((left, right) =>
      String(right.date ?? '').localeCompare(String(left.date ?? '')),
    )
    for (const record of orderedRecords) {
      if (record.total_fans !== undefined) {
        return Number(record.total_fans)
      }
    }
    return undefined
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create({ timeout: 10000 })
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

  private get miniAppConfig(): DouyinMiniAppConfigValue {
    const miniApp = this.cfg.miniApp
    if (!miniApp?.clientId || !miniApp.clientSecret) {
      throw new AppException(ResponseCode.ChannelPlatformApiFailed, { platform: AccountType.Douyin, reasonCode: 'missing_miniapp_config' })
    }

    return miniApp
  }

  private get endpoints() {
    return this.miniAppConfig.sandbox
      ? DOUYIN_MINIAPP_ENDPOINTS.sandbox
      : DOUYIN_MINIAPP_ENDPOINTS.official
  }
}
