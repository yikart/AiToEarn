// 通知状态枚举
export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
}
// 通知类型枚举
export enum NotificationType {
  TaskReminder = 'task_reminder', // 任务提醒
  TaskPunish = 'task_punish', // 任务处罚
}
export interface NewNotification {
  userId: string
  title: string
  content: string
  type: NotificationType
  relatedId: string
}
