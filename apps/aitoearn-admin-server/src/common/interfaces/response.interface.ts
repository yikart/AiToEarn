export interface CommonResponse<T> {
  data?: T
  code: number
  message: string
  timestamp?: number
}

export interface HttpResult<T> {
  data: T
  msg: string
  code: 0 | string
  url: string
}
