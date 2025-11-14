import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AccountIdSchema = z.object({
  accountId: z.string(),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

export const UserIdSchema = z.object({
  userId: z.string(),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

export const PagesSelectionSchema = UserIdSchema.extend({
  pageIds: z.array(z.string()),
})
export class PagesSelectionDto extends createZodDto(PagesSelectionSchema) {}

export const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string().describe('空间ID'),
  scopes: z.array(z.string()).optional().describe('授权 scopes'),
  platform: z.string().describe('平台标识'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

export const GetAuthInfoSchema = z.object({
  taskId: z.string(),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

export const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string(),
  state: z.string(),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(
  CreateAccountAndSetAccessTokenSchema,
) {}

export const RefreshTokenSchema = AccountIdSchema.extend({
  refreshToken: z.string(),
})
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

export const ListCommentsSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'threads']),
  accountId: z.string(),
  targetId: z.string(),
  targetType: z.enum(['post', 'comment']),
  before: z.string().nullish(),
  after: z.string().nullish(),
})

export const CreateCommentSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'threads']),
  accountId: z.string(),
  targetId: z.string(),
  targetType: z.enum(['post', 'comment']),
  message: z.string(),
})

export class ListCommentsDto extends createZodDto(ListCommentsSchema) {}
export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}
