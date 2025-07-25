export interface HttpResult<T> {
  data: T
  msg: string
  code: 0 | string
  url: string
}
