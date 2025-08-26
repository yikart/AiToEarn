export interface NatsRes<T> {
  code: number
  data: T
  message?: string
}
