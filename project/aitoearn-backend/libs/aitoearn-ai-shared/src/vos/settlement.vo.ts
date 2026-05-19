import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import {
  AiLogChannel,
  AiLogSettlementBillingMode,
  AiLogSettlementRefundReason,
  AiLogSettlementSettledBy,
  AiLogSettlementStatus,
  AiLogSettlementTaskType,
  AiLogSettlementType,
} from '../enums'

export const aiLogSettlementMetadataSchema = z.object({
  action: z.string().optional().describe('结算关联动作'),
  actualPoints: z.number().optional().describe('实际用量点数'),
  amount: z.number().optional().describe('退款金额'),
  billingMode: z.enum(AiLogSettlementBillingMode).optional().describe('结算计费模式'),
  channel: z.enum(AiLogChannel).optional().describe('结算关联渠道'),
  deltaPoints: z.number().optional().describe('预扣与实扣差值'),
  errorMessage: z.string().optional().describe('失败原因'),
  failedAt: z.string().optional().describe('失败时间'),
  hasVideoInput: z.boolean().optional().describe('是否包含视频输入'),
  prepaidPoints: z.number().optional().describe('预估用量点数'),
  tokenPrice: z.string().optional().describe('token 单价'),
  refundReason: z.enum(AiLogSettlementRefundReason).optional().describe('退款原因'),
  settledBy: z.enum(AiLogSettlementSettledBy).optional().describe('结算来源'),
  settlementType: z.enum(AiLogSettlementType).optional().describe('用量校准类型'),
  taskType: z.enum(AiLogSettlementTaskType).optional().describe('异步图片任务类型'),
  totalTokens: z.number().optional().describe('总 tokens'),
  usageMissing: z.boolean().optional().describe('provider 回调是否缺少 usage'),
})

export class AiLogSettlementMetadataVo extends createZodDto(aiLogSettlementMetadataSchema, 'AiLogSettlementMetadataVo') {}

export const aiLogSettlementSchema = z.object({
  status: z.enum(AiLogSettlementStatus).describe('结算状态'),
  prepaidPoints: z.number().describe('预估用量点数'),
  actualPoints: z.number().optional().describe('实际用量点数'),
  deltaPoints: z.number().optional().describe('预扣与实扣差值'),
  settledAt: z.date().optional().describe('结算完成时间'),
  metadata: aiLogSettlementMetadataSchema.optional().describe('结算元数据'),
})

export class AiLogSettlementVo extends createZodDto(aiLogSettlementSchema, 'AiLogSettlementVo') {}
