import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AccountType } from '../../../libs/common/enums'

export const AccountInfoSchema = z.object({
  id: z.string().describe('账号ID'),
})
export class AccountInfoDto extends createZodDto(
  AccountInfoSchema,
) {}

export const AccountListQuerySchema = z.object({
  type: z.nativeEnum(AccountType).optional(),
})
export class AccountListQueryDto extends createZodDto(
  AccountListQuerySchema,
) {}
