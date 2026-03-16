/**
 * 发布媒体任务数据（Meta平台）
 */
export interface PostMediaTaskData {
  /** 任务ID */
  taskId: string
  /** 重试次数 */
  attempts: number
  /** 任务ID（可选） */
  jobId?: string
}
