import { createZodDto } from '@yikart/common'
import { WalletAccountType } from '@yikart/mongodb'
import z from 'zod'

export const createUserWalletAccountSchema = z.object({
  mail: z.email().optional().describe('邮箱'),
  userName: z.string().describe('真实姓名').optional(),
  account: z.string().describe('账号'),
  cardNum: z.string().describe('身份证号').optional(),
  phone: z.string().describe('绑定的手机号').optional(),
  type: z.nativeEnum(WalletAccountType).describe('类型'),
})
export class CreateUserWalletAccountDto extends createZodDto(createUserWalletAccountSchema) {}

export const updateUserWalletAccountSchema = z.object({
  ...createUserWalletAccountSchema.shape,
  id: z.string().describe('ID'),
})
export class UpdateUserWalletAccountDto extends createZodDto(updateUserWalletAccountSchema) {}

export const userWalletAccountIdSchema = z.object({
  ...createUserWalletAccountSchema.shape,
  id: z.string().describe('ID'),
})
export class UserWalletAccountIdDto extends createZodDto(userWalletAccountIdSchema) {}

export const incomeRecordListFilterSchema = z.object({
  userId: z.string().optional(),
})
export class UserWalletAccountListFilterDto extends createZodDto(incomeRecordListFilterSchema) {}
