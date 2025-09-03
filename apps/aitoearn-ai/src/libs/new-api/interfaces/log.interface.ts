import { PaginationParams, TimeRangeParams } from './common.interface'

/**
 * 日志信息接口
 */
export interface LogInfo {
  id: number
  user_id: number
  created_at: number
  type: number
  content: string
  username: string
  token_name: string
  model_name: string
  quota: number
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
  channel: number
  channel_name: string
  token_id: number
  group: string
  ip: string
  other: string
}

/**
 * 日志类型枚举
 */
export enum LogType {
  UNKNOWN = 0,
  RECHARGE = 1,
  CONSUMPTION = 2,
  MANAGEMENT = 3,
  SYSTEM = 4,
  ERROR = 5,
}

/**
 * 用户日志查询参数
 */
export interface LogQueryParams extends PaginationParams, TimeRangeParams {
  type?: number
  token_name?: string
  model_name?: string
  group?: string
}

/**
 * 获取所有日志参数
 */
export interface GetAllLogsParams {
  params?: AdminLogQueryParams
}

/**
 * 日志查询参数
 */
export interface AdminLogQueryParams extends LogQueryParams {
  username?: string
  channel?: number
}
