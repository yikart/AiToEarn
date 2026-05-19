export interface UserEventItem {
  userId: string
  event: string
  properties?: Record<string, unknown>
  bizKey?: string
  source: 'backend' | 'frontend'
  sessionId?: string
  path?: string
  timestamp?: number
  ip?: string
  userAgent?: string
}

export interface UserEventBatchData {
  events: UserEventItem[]
}
