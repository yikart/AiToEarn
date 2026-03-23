// 通知状态枚举
export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
}

// 通知类型枚举
export enum NotificationType {
  TaskReminder = 'task_reminder',
  AgentResult = 'agent_result',
  AppRelease = 'app_release',
  AiReviewSkipped = 'ai_review_skipped',
  TaskSubmitted = 'task_submitted',
  TaskReviewRejected = 'task_review_rejected',
  TaskReviewApproved = 'task_review_approved',
  TaskSettled = 'task_settled',
}
