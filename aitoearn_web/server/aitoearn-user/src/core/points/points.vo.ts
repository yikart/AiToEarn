import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

// 用户积分余额 VO
export const pointsBalanceVoSchema = z.object({
  balance: z.number().describe('用户积分余额'),
})

export class PointsBalanceVo extends createZodDto(pointsBalanceVoSchema) {}

// 积分记录 VO
export const pointsRecordVoSchema = z.object({
  id: z.string().describe('记录ID'),
  userId: z.string().describe('用户ID'),
  amount: z.number().describe('积分变动数量'),
  balance: z.number().describe('变动后余额'),
  type: z.string().describe('积分变动类型'),
  description: z.string().optional().describe('积分变动描述'),
  metadata: z.record(z.string(), z.any()).optional().describe('额外信息'),
  createdAt: z.date().or(z.string()).describe('创建时间'),
})

export class PointsRecordVo extends createZodDto(pointsRecordVoSchema) {}

// 积分记录列表 VO
export const pointsRecordsVoSchema = z.object({
  list: z.array(pointsRecordVoSchema).describe('积分记录列表'),
  total: z.number().describe('总记录数'),
})

export class PointsRecordsVo extends createZodDto(pointsRecordsVoSchema) {}
