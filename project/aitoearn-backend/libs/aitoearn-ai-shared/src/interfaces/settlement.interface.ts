import type { CreditsConsumptionSource } from '@yikart/common'
import type { AiLogChannel } from '../enums'
import {
  AiLogSettlementBillingMode,
  AiLogSettlementRefundReason,
  AiLogSettlementSettledBy,
  AiLogSettlementStatus,
  AiLogSettlementTaskType,
  AiLogSettlementType,
} from '../enums'

export interface AiLogSettlementMetadata {
  action?: string
  actualPoints?: number
  amount?: number
  billingMode?: AiLogSettlementBillingMode
  channel?: AiLogChannel
  deltaPoints?: number
  errorMessage?: string
  failedAt?: string
  hasVideoInput?: boolean
  prepaidPoints?: number
  source?: CreditsConsumptionSource
  tokenPrice?: string
  refundReason?: AiLogSettlementRefundReason
  settledBy?: AiLogSettlementSettledBy
  settlementType?: AiLogSettlementType
  taskType?: AiLogSettlementTaskType
  totalTokens?: number
  usageMissing?: boolean
}

export interface AiLogSettlement {
  status: AiLogSettlementStatus
  prepaidPoints: number
  actualPoints?: number
  deltaPoints?: number
  settledAt?: Date
  metadata?: AiLogSettlementMetadata
}
