/**
 * AI任务失败退款数据接口
 */
export interface AiTaskRefundData {
  /** 用户ID */
  userId: string
  /** AI任务ID (用于幂等性) */
  taskId: string
  /** 退款金额（单位：分） */
  amount: number
  /** 描述（模型名称） */
  description?: string
  /** 元数据 */
  metadata?: Record<string, unknown>
  /** 过期时间（null表示永久） */
  expiredAt?: Date | null
}
