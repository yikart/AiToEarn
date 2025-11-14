import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const UserIdSchema = z.object({
  userId: z.string().describe('用户ID'),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

const GetAuthUrlSchema = UserIdSchema.extend({
  type: z.enum(['h5', 'pc']).describe('授权类型'),
  spaceId: z.string().describe('空间ID'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const AddKwaiAccountSchema = UserIdSchema.extend({
  code: z.string().describe('授权成功后获取的code'),
})
export class AddKwaiAccountDto extends createZodDto(AddKwaiAccountSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string().describe('任务ID'),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  taskId: z.string(),
  code: z.string(),
  state: z.string(),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(
  CreateAccountAndSetAccessTokenSchema,
) {}

const AccountIdSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const GetPohotListSchema = AccountIdSchema.extend({
  cursor: z.string().optional().describe('分页游标'),
  count: z.coerce.number().min(1).max(200).optional().describe('数量，默认20，最大200'),
})
export class GetPohotListDto extends createZodDto(GetPohotListSchema) {}
