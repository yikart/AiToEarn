import { NotificationMessageKey, NotificationType, UserType } from '@yikart/common'

// 通知状态枚举
export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
}

export interface NewNotification {
  userId: string
  userType: UserType
  type: NotificationType
  relatedId: string
  messageKey?: NotificationMessageKey
  vars?: Record<string, unknown>
  title?: string
  content?: string
}
