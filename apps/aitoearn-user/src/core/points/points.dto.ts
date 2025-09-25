import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 添加积分的 DTO
export const addPointsSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('积分数量'),
  type: z.string().min(1).describe('积分类型'),
  description: z.string().optional().describe('积分描述'),
  metadata: z.record(z.string(), z.any()).optional().describe('额外信息'),
})

export class AddPointsDto extends createZodDto(addPointsSchema) {}

// 扣减积分的 DTO
export const deductPointsSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  amount: z.number().min(0).describe('积分数量'),
  type: z.string().min(1).describe('积分类型'),
  description: z.string().optional().describe('积分描述'),
  metadata: z.record(z.string(), z.any()).optional().describe('额外信息'),
})

export class DeductPointsDto extends createZodDto(deductPointsSchema) {}

// 查询用户积分余额的 DTO
export const pointsBalanceSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
})

export class PointsBalanceDto extends createZodDto(pointsBalanceSchema) {}

// 查询积分记录列表的 DTO
export const pointsRecordsSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  page: z.int().min(1).describe('页码'),
  pageSize: z.int().min(1).describe('每页数量'),
})

export class PointsRecordsDto extends createZodDto(pointsRecordsSchema) {}
