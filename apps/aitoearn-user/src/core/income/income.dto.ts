import { createZodDto, TableDtoSchema } from '@yikart/common'
import { IncomeRecordType } from '@yikart/mongodb'
import { z } from 'zod'

export const addIncomeSchema = z.object({
  userId: z.string().describe('用户ID'),
  amount: z.number().min(0).describe('数量'),
  type: z.enum(IncomeRecordType).describe('类型'),
  relId: z.string().optional().describe('关联数据ID'),
  desc: z.string().optional().describe('备注'),
  metadata: z.record(z.string(), z.any()).optional().describe('额外信息'),
})
export class AddIncomeDto extends createZodDto(addIncomeSchema) {}

// 扣减
export const deductIncomeSchema = z.object({
  userId: z.string().describe('用户ID'),
  amount: z.number().min(0).describe('数量'),
  type: z.enum(IncomeRecordType).describe('类型'),
  relId: z.string().optional().describe('关联数据ID'),
  desc: z.string().optional().describe('备注'),
  metadata: z.record(z.string(), z.any()).optional().describe('额外信息'),
})
export class DeductIncomeDto extends createZodDto(deductIncomeSchema) {}

export const incomeBalanceSchema = z.object({
  userId: z.string().describe('用户ID'),
})
export class IncomeBalanceDto extends createZodDto(incomeBalanceSchema) {}

export const incomeRecordListFilterSchema = z.object({
  userId: z.string(),
})
export const incomeRecordListSchema = z.object({
  page: TableDtoSchema,
  filter: incomeRecordListFilterSchema,
})
export class IncomeRecordListDto extends createZodDto(incomeRecordListSchema) {}
