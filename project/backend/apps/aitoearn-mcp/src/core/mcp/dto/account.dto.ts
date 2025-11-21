import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AccountInfoSchema = z.object({
  id: z.string().describe('账号ID'),
})
export class AccountInfoDto extends createZodDto(
  AccountInfoSchema,
) {}

export const AccountListQuerySchema = z.object({
  type: z.enum(AccountType).optional(),
})
export class AccountListQueryDto extends createZodDto(
  AccountListQuerySchema,
) {}
