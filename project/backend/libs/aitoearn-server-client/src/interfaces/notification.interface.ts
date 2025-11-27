import { NotificationType, UserType } from '@yikart/common'

export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
}

export interface NewNotification {
  userId: string
  userType: UserType
  title: string
  content: string
  type: NotificationType
  relatedId: string
}
