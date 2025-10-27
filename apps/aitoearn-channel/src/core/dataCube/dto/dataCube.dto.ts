import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AccountSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountDto extends createZodDto(
  AccountSchema,
) {}

export const ArcSchema = z.object({
  accountId: z.string().describe('账号ID'),
  dataId: z.string(),
})
export class ArcDto extends createZodDto(
  ArcSchema,
) {}
