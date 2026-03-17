export interface CommonResponse<T> {
  data?: T
  code: number
  message: string
  timestamp?: number
}
