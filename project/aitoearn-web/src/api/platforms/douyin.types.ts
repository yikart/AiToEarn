import type { DouyinMiniAppDataAuthScope } from './douyin.constants'
// Source: platforms/douyin.api.ts inline types
// Source: plat/douyin.ts

/**
 * DouyinMiniAppSession 类型。
 */
export interface DouyinMiniAppSession {
  bound: boolean
  token?: string
  exp?: number
  bindInfo: {
    provider: 'douyinMiniApp'
    bound: boolean
    openId?: string
    unionIdMasked?: string
  }
}

/**
 * DouyinMiniAppQrLoginCreate 类型。
 */
export interface DouyinMiniAppQrLoginCreate {
  sessionId: string
  expiresAt: number
  qrCodePath: string
  qrCodeBase64: string
  qrCodeDataUrl: string
}

/**
 * DouyinMiniAppChannelAuthCompleteParams 请求参数。
 */
export interface DouyinMiniAppChannelAuthCompleteParams {
  taskId: string
  loginCode: string
  nickname?: string
  avatar?: string
  dataAuthTicket: string
}

/**
 * DouyinMiniAppDataAuthStatus 类型。
 */
export interface DouyinMiniAppDataAuthStatus {
  authorized: boolean
  scope: DouyinMiniAppDataAuthScope | string
  openId?: string
  expiresAt?: number
}

/**
 * DouyinMiniAppFansCountItem 数据结构。
 */
export interface DouyinMiniAppFansCountItem {
  date: string
  newFans: number
  totalFans: number
}

/**
 * DouyinMiniAppFansCount 类型。
 */
export interface DouyinMiniAppFansCount {
  scope: DouyinMiniAppDataAuthScope | string
  dateType: number
  list: DouyinMiniAppFansCountItem[]
}
/**
 * Douyin mini app channel auth completion response.
 */
export interface DouyinMiniAppChannelAuthCompleteVo {
  status: number
  accountId?: string
  message?: string
}
