export interface NotificationDetail {
  id: string
  userId: string
  title: string
  content: string
  type: string
  status: string
  relatedId: string
  createdAt: string
  updatedAt: string
  readAt?: string
}

export interface NotificationListResult {
  list: NotificationDetail[]
  total: number
}

export interface UnreadCountResult {
  count: number
}

export interface OperationResult {
  affectedCount?: number
}
