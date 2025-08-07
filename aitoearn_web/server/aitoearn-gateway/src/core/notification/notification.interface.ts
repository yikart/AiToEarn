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
  items: NotificationDetail[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UnreadCountResult {
  count: number
}

export interface OperationResult {
  affectedCount?: number
}
