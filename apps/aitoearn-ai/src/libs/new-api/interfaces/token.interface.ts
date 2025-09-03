import { PaginationParams } from './common.interface'

/**
 * Token信息接口
 */
export interface TokenInfo {
  id: number
  user_id: number
  key: string
  status: number
  name: string
  created_time: number
  accessed_time: number
  expired_time: number
  remain_quota: number
  unlimited_quota: boolean
  model_limits_enabled: boolean
  model_limits: string
  allow_ips: string
  used_quota: number
  group: string
}

/**
 * 创建Token请求参数
 */
export interface CreateTokenParams {
  request: CreateTokenRequest
}

/**
 * 创建Token请求接口
 */
export interface CreateTokenRequest {
  name: string
  expired_time?: number
  remain_quota: number
  unlimited_quota?: boolean
  model_limits_enabled?: boolean
  model_limits?: string
  allow_ips?: string
  group?: string
}

/**
 * 获取Token列表参数
 */
export interface GetTokensParams {
  params?: TokenListParams
}

/**
 * Token列表查询参数
 */
export interface TokenListParams extends PaginationParams {
  // 继承分页参数
}

/**
 * 获取单个Token参数
 */
export interface GetTokenParams {
  tokenId: number
}

/**
 * 更新Token参数
 */
export interface UpdateTokenParams {
  request: UpdateTokenRequest
}

/**
 * 更新Token请求接口
 */
export interface UpdateTokenRequest {
  id: number
  name?: string
  status?: number
  expired_time?: number
  remain_quota?: number
  unlimited_quota?: boolean
  model_limits_enabled?: boolean
  model_limits?: string
  allow_ips?: string
  group?: string
}

/**
 * Token状态枚举
 */
export enum TokenStatus {
  ENABLED = 1,
  DISABLED = 2,
  EXPIRED = 3,
  QUOTA_EXHAUSTED = 4,
}
