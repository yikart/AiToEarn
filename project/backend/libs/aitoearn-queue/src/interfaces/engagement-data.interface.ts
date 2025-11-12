/**
 * 互动任务分发数据（供 Consumer 使用）
 */
export interface EngagementTaskDistributionData {
  taskId: string
  attempts: number
}

/**
 * 评论回复任务数据（供 Consumer 使用）
 */
export interface EngagementReplyToCommentData {
  taskId: string
  attempts: number
}
