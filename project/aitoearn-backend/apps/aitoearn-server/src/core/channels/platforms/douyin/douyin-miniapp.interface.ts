import type { DouyinPlatformResponseBody } from './douyin.exception'
import { DouyinOAuthGrantType } from './douyin.interface'

export { DouyinOAuthGrantType }

export interface DouyinMiniAppQrCodeOptions {
  path: string
  width: number
  appName: string
  isCircleCode: boolean
}

export interface DouyinMiniAppQrCodeResponse extends DouyinPlatformResponseBody {
  data?: {
    img?: string
  }
}

export interface DouyinMiniAppCode2SessionResponse extends DouyinPlatformResponseBody {
  data?: {
    openid?: string
    unionid?: string
    anonymous_openid?: string
    anonymousOpenid?: string
  }
}

export interface DouyinMiniAppAccessTokenResponse extends DouyinPlatformResponseBody {
  data?: {
    access_token?: string
    refresh_token?: string
    expires_in?: number | string
    refresh_expires_in?: number | string
    open_id?: string
    scope?: string
    error_code?: number | string
    description?: string
  }
}

export interface DouyinMiniAppClientTokenResponse extends DouyinPlatformResponseBody {
  data?: {
    access_token?: string
    expires_in?: number | string
    error_code?: number | string
    description?: string
  }
}

export interface DouyinMiniAppFansRecord {
  date?: string
  new_fans?: string
  total_fans?: string
}

export interface DouyinMiniAppFansResponse extends Omit<DouyinPlatformResponseBody, 'data'> {
  data?: {
    result_list?: DouyinMiniAppFansRecord[]
    data?: {
      result_list?: DouyinMiniAppFansRecord[]
    }
    extra?: DouyinPlatformResponseBody['extra']
  }
}

export interface DouyinMiniAppVideoStatistics {
  share_count: number
  forward_count: number
  comment_count: number
  digg_count: number
  download_count: number
  play_count: number
}

export interface DouyinMiniAppVideoAnchor {
  anchor_type?: number
  anchor_id?: string
}

export enum DouyinMiniAppVideoStatus {
  Visible = 1,
}

export interface DouyinMiniAppVideoItem {
  video_id?: string
  video_status: DouyinMiniAppVideoStatus | number
  media_type?: number
  share_url: string
  video_anchor?: DouyinMiniAppVideoAnchor
  title: string
  item_id: string
  is_top: boolean
  create_time: string
  is_reviewed: boolean
  statistics?: DouyinMiniAppVideoStatistics
  cover: string
}

export interface DouyinMiniAppVideoQueryExtra {
  now: string
  error_code: number
  description: string
  sub_error_code: number
  sub_description: string
  logid: string
}

export interface DouyinMiniAppVideoQueryResponse extends Omit<DouyinPlatformResponseBody, 'data'> {
  data?: {
    extra?: DouyinMiniAppVideoQueryExtra
    list?: DouyinMiniAppVideoItem[]
  }
}

export interface DouyinMiniAppVideoIdToOpenItemIdResponse extends DouyinPlatformResponseBody {
  data?: {
    convert_result?: Record<string, string> | DouyinMiniAppVideoIdToOpenItemIdResult[]
  }
}

export interface DouyinMiniAppVideoIdToOpenItemIdResult {
  _key?: string
  key?: string
  video_id?: string
  _val?: string
  value?: string
  item_id?: string
}

export interface DouyinMiniAppSessionInfo {
  openid: string
  unionid?: string
  anonymousOpenid?: string
}

export interface DouyinMiniAppAccessTokenInfo {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  refreshExpiresIn?: number
  openId?: string
  scope?: string
}
