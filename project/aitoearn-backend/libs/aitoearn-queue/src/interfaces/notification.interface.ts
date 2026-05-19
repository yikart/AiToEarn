import { NotificationMessageKey, NotificationType, UserType } from '@yikart/common'
import { ContentGenerationTaskStatus } from '@yikart/mongodb'

export interface NotificationAgentResultData {
  taskId: string
  status: ContentGenerationTaskStatus
  description: string
}

interface BaseNotificationData {
  userId: string
  userType: UserType
  relatedId: string
  messageKey?: NotificationMessageKey
  vars?: Record<string, unknown>
  title?: string
  content?: string
}

type NotificationDataByType
  = | (BaseNotificationData & {
    type: NotificationType.AgentResult
    data: NotificationAgentResultData
  })
  | (BaseNotificationData & {
    type: NotificationType.AppRelease
    data?: Record<string, unknown>
  })

export type NotificationData = NotificationDataByType
