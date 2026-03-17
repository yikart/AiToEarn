import { CreditsType } from '@yikart/common'

/**
 * Credits 购买数据接口
 */
export interface CreditsPurchaseData {
  /** 用户ID */
  userId: string
  /** 订单ID */
  checkoutId: string
  /** 购买金额（单位：分） */
  amount: number
  /** 类型 */
  type: CreditsType
  /** 描述 */
  description?: string
  /** 元数据 */
  metadata?: Record<string, unknown>
  /** 过期时间 */
  expiredAt?: Date | null
}

/**
 * Credits 退款数据接口
 */
export interface CreditsRefundData {
  /** 用户ID */
  userId: string
  /** 订单ID */
  checkoutId: string
  /** 退款金额（单位：分） */
  amount: number
  /** 类型 */
  type: CreditsType
  /** 描述 */
  description?: string
  /** 元数据 */
  metadata?: Record<string, unknown>
}
