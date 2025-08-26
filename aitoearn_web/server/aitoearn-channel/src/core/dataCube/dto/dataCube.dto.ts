import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const AccountSchema = z.object({
  accountId: z.string({ required_error: '账号ID' }),
})
export class AccountDto extends createZodDto(
  AccountSchema,
) {}

export const ArcSchema = z.object({
  accountId: z.string({ required_error: '账号ID' }),
  dataId: z.string({ required_error: 'dataId不能为空' }),
})
export class ArcDto extends createZodDto(
  ArcSchema,
) {}
