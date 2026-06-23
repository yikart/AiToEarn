export interface CommonResponse<T> {
  data?: T
  code: number
  message: string
  requestId?: string
  timestamp?: number
}
