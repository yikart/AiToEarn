import { createZodDto, TableDtoSchema } from '@yikart/common'
import { WalletAccountType } from '@yikart/mongodb'
import { z } from 'zod'

export const createUserWalletAccountSchema = z.object({
  userId: z.string().describe('用户ID'),
  mail: z.email().describe('邮箱'),
  userName: z.string().describe('真实姓名').optional(),
  account: z.string().describe('账号'),
  cardNum: z.string().describe('身份证号').optional(),
  phone: z.string().describe('绑定的手机号').optional(),
  type: z.enum(WalletAccountType).describe('类型'),
})
export class CreateUserWalletAccountDto extends createZodDto(createUserWalletAccountSchema) {}

export const updateUserWalletAccountSchema = z.object({
  mail: z.email().describe('邮箱').optional(),
  userName: z.string().describe('真实姓名').optional(),
  account: z.string().describe('账号').optional(),
  cardNum: z.string().describe('身份证号').optional(),
  phone: z.string().describe('绑定的手机号').optional(),
  type: z.enum(WalletAccountType).optional().describe('类型'),
  id: z.string().describe('ID'),
})
export class UpdateUserWalletAccountDto extends createZodDto(updateUserWalletAccountSchema) {}

export const userWalletAccountIdSchema = z.object({
  id: z.string().describe('ID'),
})
export class UserWalletAccountIdDto extends createZodDto(userWalletAccountIdSchema) {}

export const incomeRecordListFilterSchema = z.object({
  userId: z.string().optional(),
})
export const incomeRecordListSchema = z.object({
  page: TableDtoSchema,
  filter: incomeRecordListFilterSchema,
})
export class UserWalletAccountListDto extends createZodDto(incomeRecordListSchema) {}
