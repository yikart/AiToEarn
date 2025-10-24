import { createZodDto, TableDtoSchema } from '@yikart/common'
import { IncomeType } from '@yikart/mongodb'
import { z } from 'zod'

export const IncomeIdSchema = z.object({
  id: z.string().describe('ID'),
})
export class IncomeIdDto extends createZodDto(IncomeIdSchema) {}

export const IncomeFilterSchema = z.object({
  status: z.enum(IncomeType).optional().describe('状态'),
})
export class IncomeFilterDto extends createZodDto(IncomeFilterSchema) {}

export const IncomeListSchema = z.object({
  filter: IncomeFilterSchema.optional(),
  page: TableDtoSchema,
})
export class IncomeListDto extends createZodDto(IncomeListSchema) {}

export const withdrawCreateSchema = z.object({
  flowId: z.string().min(1).optional(),
  userWalletAccountId: z.string().min(1).optional(),
  incomeRecordId: z.string().min(1),
})
export class WithdrawCreateDto extends createZodDto(withdrawCreateSchema) {}

export const withdrawCreateAllSchema = z.object({
  userWalletAccountId: z.string(),
})
export class WithdrawCreateAllDto extends createZodDto(withdrawCreateAllSchema) {}

export const addIncomeSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  type: z.enum(IncomeType),
  description: z.string().optional(),
  metadata: z.any().optional(),
  relId: z.string().optional(),
  withdrawId: z.string().optional(),
})
export class AddIncomeSchemaDto extends createZodDto(addIncomeSchema) {}

export const DeductIncomeSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  type: z.enum(IncomeType),
  description: z.string().optional(),
  metadata: z.any().optional(),
  relId: z.string().optional(),
  withdrawId: z.string().optional(),
})
export class DeductIncomeDto extends createZodDto(DeductIncomeSchema) {}
