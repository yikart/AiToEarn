import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ArchiveStatus } from '../bilibili.common'

export const AccountIdSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

export const AccessBackSchema = z.object({
  code: z.string().describe('code'),
  state: z.string().describe('state'),
})
export class AccessBackDto extends createZodDto(AccessBackSchema) {}

const GetArchiveListSchema = AccountIdSchema.extend({
  status: z.enum(ArchiveStatus).optional(),
})
export class GetArchiveListDto extends createZodDto(GetArchiveListSchema) {}

const GetArcStatSchema = AccountIdSchema.extend({
  resourceId: z.string({ message: '稿件ID' }),
})
export class GetArcStatDto extends createZodDto(GetArcStatSchema) {}
