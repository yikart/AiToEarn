import { AccountType } from '@yikart/aitoearn-server-client'
import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const GetAccountInfoSchema = z.object({
  id: z.string().describe('账号ID'),
})
export class GetAccountInfoDto extends createZodDto(
  GetAccountInfoSchema,
) {}

export const GetAccountListQuerySchema = z.object({
  type: z.enum(AccountType).optional(),
})
export class GetAccountListQueryDto extends createZodDto(
  GetAccountListQuerySchema,
) {}
