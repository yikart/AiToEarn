export interface NatsRes<T> {
  code: number
  message: string
  data?: T
  timestamp: number
}
