/**
 * Credits API - 用户余额相关接口
 * 包含余额查询和使用记录查询
 */

import http from '@/utils/request'

/** Credits 变动类型 */
export type CreditsType
  = | 'register_bonus'
    | 'purchase'
    | 'vip_monthly'
    | 'ai_service'
    | 'video_style_transfer'
    | 'publish'
    | 'expired'
    | 'manual'

/** 余额响应 */
export interface CreditsBalanceVo {
  /** 当前 Credits 余额（美分） */
  balance: number
}

/** 单条使用记录 */
export interface CreditsRecordVo {
  /** 记录 ID */
  id: string
  /** 用户 ID */
  userId: string
  /** Credits 变动数量（美分） */
  amount: number
  /** 该记录剩余的可用余额（美分） */
  balance: number
  /** Credits 变动类型 */
  type: CreditsType
  /** Credits 变动描述 */
  description?: string
  /** 过期时间，null 表示永久有效 */
  expiredAt?: string | null
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 使用记录列表响应 */
export interface CreditsRecordsVo {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: CreditsRecordVo[]
}

/** 获取使用记录的参数 */
export interface GetCreditsRecordsParams {
  page?: number
  pageSize?: number
  type?: CreditsType
}

/**
 * 获取用户余额
 */
export function getCreditsBalanceApi() {
  return http.get<CreditsBalanceVo>('user/credits')
}

/**
 * 获取用户余额使用记录
 */
export function getCreditsRecordsApi(params?: GetCreditsRecordsParams) {
  return http.get<CreditsRecordsVo>('user/credits/records', params)
}

/**
 * 美分转美元（保留2位小数）
 */
export function centsToUsd(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * 格式化金额变更（带正负号）
 */
export function formatAmountChange(cents: number): string {
  const usd = centsToUsd(Math.abs(cents))
  return cents >= 0 ? `+$${usd}` : `-$${usd}`
}
