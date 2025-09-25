import { createZodDto, TableDtoSchema } from '@yikart/common'
import { WithdrawRecordStatus, WithdrawRecordType } from '@yikart/mongodb'
import { z } from 'zod'

export const withdrawCreateSchema = z.object({
  userId: z.string().min(1),
  flowId: z.string().optional(),
  userWalletAccountId: z.string().optional(),
  type: z.enum(WithdrawRecordType),
  amount: z.number().min(0),
  relId: z.string().min(1).optional(),
  incomeRecordId: z.string().min(1).optional(),
  remark: z.string().min(1).optional(),
})
export class WithdrawCreateDto extends createZodDto(withdrawCreateSchema) { }

export const withdrawInfoSchema = z.object({
  id: z.string().min(1),
})
export class WithdrawInfoDto extends createZodDto(withdrawInfoSchema) { }

export const userWithdrawListFilterSchema = z.object({
  userId: z.string().min(1),
})
export const userWithdrawListSchema = z.object({
  filter: userWithdrawListFilterSchema,
  page: TableDtoSchema,
})
export class UserWithdrawListDto extends createZodDto(userWithdrawListSchema) { }

export const adminWithdrawListFilterSchema = z.object({
  userId: z.string().min(1).optional(),
  status: z.enum(WithdrawRecordStatus).optional(),
})
export const adminWithdrawListSchema = z.object({
  filter: adminWithdrawListFilterSchema,
  page: TableDtoSchema,
})
export class AdminWithdrawListDto extends createZodDto(adminWithdrawListSchema) { }

export const withdrawReleaseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(WithdrawRecordStatus),
  desc: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
})
export class WithdrawReleaseDto extends createZodDto(withdrawReleaseSchema) { }
