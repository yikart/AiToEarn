/**
 * 发布任务数据
 */
export interface PostPublishData {
  /** 任务ID */
  taskId: string
  /** 重试次数 */
  attempts: number
  /** 任务ID（可选） */
  jobId?: string
  /** 超时时间（毫秒，可选） */
  timeout?: number
}
