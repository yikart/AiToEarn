import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AccountType } from '@/transports/account/common'

export const GetAccountInfoSchema = z.object({
  id: z.string({ required_error: '账号ID' }),
})
export class GetAccountInfoDto extends createZodDto(
  GetAccountInfoSchema,
) {}

export const GetAccountListQuerySchema = z.object({
  type: z.nativeEnum(AccountType).optional(),
})
export class GetAccountListQueryDto extends createZodDto(
  GetAccountListQuerySchema,
) {}
