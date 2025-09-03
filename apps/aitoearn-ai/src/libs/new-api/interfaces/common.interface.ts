/**
 * 通用API响应接口
 */
export interface ApiResponse<T = undefined | unknown> {
  success: boolean
  message: string
  data: T
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  p?: number
  page_size?: number
}

/**
 * 时间范围查询参数
 */
export interface TimeRangeParams {
  start_timestamp?: number
  end_timestamp?: number
}

/**
 * HTTP请求配置
 */
export interface RequestConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
}

/**
 * 内部服务鉴权头部
 */
export interface InternalAuthHeaders {
  'X-Internal-Service-Token': string
  'New-Api-User': string
  'Content-Type': string
}
