import type { UserType } from '@yikart/common'
import type { AiLogChannel, AiLogType } from '@yikart/mongodb'

/**
 * AI图片异步生成任务数据
 */
export interface AiImageData {
  /** 日志ID */
  logId: string
  /** 用户ID */
  userId: string
  /** 用户类型 */
  userType: UserType
  /** 模型名称 */
  model: string
  /** 渠道 */
  channel?: AiLogChannel
  /** 日志类型 */
  type: AiLogType
  /** 计费 */
  pricing: number
  /** 请求参数 */
  request: unknown
  /** 任务类型 */
  taskType: 'generation' | 'edit' | 'md2card' | 'fireflyCard'
}
