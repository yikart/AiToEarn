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
  pageIds: z.array(z.string()).describe('页面ID列表'),
})
export class PagesSelectionDto extends createZodDto(PagesSelectionSchema) {}

export const FacebookPageSelectionSchema = z.object({
  pageIds: z.array(z.string()).describe('页面ID列表'),
})
export class FacebookPageSelectionDto extends createZodDto(FacebookPageSelectionSchema) {}

export const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string().describe('空间ID'),
  scopes: z.array(z.string()).optional().describe('授权 scopes'),
  platform: z.string().describe('平台标识'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

export const GetAuthUrlBodySchema = z.object({
  scopes: z.array(z.string()).optional().describe('授权 scopes'),
  spaceId: z.string().optional().describe('空间ID'),
  platform: z.string().describe('平台标识'),
  callbackUrl: z.string().url().optional().describe('OAuth 完成后回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式，默认 GET'),
})
export class GetAuthUrlBodyDto extends createZodDto(GetAuthUrlBodySchema) {}

export const GetAuthInfoSchema = z.object({
  taskId: z.string(),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

export const GetNoUserAuthUrlSchema = z.object({
  materialGroupId: z.string().describe('素材组ID'),
})
export class GetNoUserAuthUrlDto extends createZodDto(GetNoUserAuthUrlSchema) {}

export const AuthRedirectQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
})
export class AuthRedirectQueryDto extends createZodDto(AuthRedirectQuerySchema) {}

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

export const CrawlerAccountQuerySchema = z.object({
  accountId: z.string().describe('账号 ID'),
  query: z.record(z.string(), z.any()).optional().describe('查询参数'),
})
export class CrawlerAccountQueryDto extends createZodDto(CrawlerAccountQuerySchema) {}

export const CrawlerAccountPostSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  postId: z.string().describe('帖子 ID'),
})
export class CrawlerAccountPostDto extends createZodDto(CrawlerAccountPostSchema) {}

export const CrawlerAccountPostQuerySchema = z.object({
  accountId: z.string().describe('账号 ID'),
  postId: z.string().describe('帖子 ID'),
  query: z.record(z.string(), z.any()).optional().describe('查询参数'),
})
export class CrawlerAccountPostQueryDto extends createZodDto(CrawlerAccountPostQuerySchema) {}
