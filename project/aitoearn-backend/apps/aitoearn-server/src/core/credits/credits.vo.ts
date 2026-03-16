import { createPaginationVo, createZodDto, CreditsType } from '@yikart/common'
import { z } from 'zod'

export const creditsRecordVoSchema = z.object({
  id: z.string().describe('记录ID'),
  userId: z.string().describe('用户ID'),
  amount: z.number().describe('Credits变动数量（美分）'),
  balance: z.number().describe('该记录剩余的可用余额（美分）'),
  type: z.enum(CreditsType).describe('Credits变动类型'),
  description: z.string().optional().describe('Credits变动描述'),
  expiredAt: z.date().nullable().optional().describe('过期时间，null表示永久有效'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class CreditsRecordVo extends createZodDto(creditsRecordVoSchema, 'CreditsRecordVo') {}

export const creditsRecordsVoSchema = createPaginationVo(creditsRecordVoSchema, 'CreditsRecordsVo')

export class CreditsRecordsVo extends creditsRecordsVoSchema {}

export const creditsBalanceVoSchema = z.object({
  balance: z.number().describe('当前Credits余额（美分）'),
})

export class CreditsBalanceVo extends createZodDto(creditsBalanceVoSchema, 'CreditsBalanceVo') {}
