import { createZodDto, CreditsType } from '@yikart/common'
import { z } from 'zod'

// 添加Credits的 DTO
export const addCreditsSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('Credits数量（美分）'),
  type: z.enum(CreditsType).describe('Credits类型'),
  description: z.string().optional().describe('Credits描述'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('元数据'),
  expiredAt: z.date().nullable().optional().describe('过期时间，null表示永久有效'),
})

export class AddCreditsDto extends createZodDto(addCreditsSchema, 'AddCreditsDto') {}

// 扣减Credits的 DTO
export const deductCreditsSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('Credits数量（美分）'),
  type: z.enum(CreditsType).describe('Credits类型'),
  description: z.string().optional().describe('Credits描述'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('元数据'),
})

export class DeductCreditsDto extends createZodDto(deductCreditsSchema, 'DeductCreditsDto') {}
