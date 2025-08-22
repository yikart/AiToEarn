export interface CommonResponse<T> {
  data?: T
  code: number
  message: string
  timestamp?: number
}

export interface HttpResult<T> {
  data?: T // 数据
  message: string // 信息
  code: number // 自定义code
  url: string // 错误的url地址
}
