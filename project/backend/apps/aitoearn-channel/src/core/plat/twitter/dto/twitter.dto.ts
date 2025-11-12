import { createZodDto } from '@yikart/common'
import z from 'zod'

const AccountIdSchema = z.object({
  accountId: z.string(),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) { }

const UserIdSchema = z.object({
  userId: z.string(),
})

export class UserIdDto extends createZodDto(UserIdSchema) { }

const GetAuthUrlSchema = z.object({
  userId: z.string(),
  spaceId: z.string(),
  scopes: z.array(z.string()).optional(),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) { }

const GetAuthInfoSchema = z.object({
  taskId: z.string(),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) { }

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}

const RefreshTokenSchema = z.object({
  accountId: z.string(),
  refreshToken: z.string(),
})
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

const UserTimelineSchema = z.object({
  accountId: z.string(),
  userId: z.string(),
  sinceId: z.string().optional(),
  untilId: z.string().optional(),
  maxResults: z.string().optional(),
  paginationToken: z.string().optional(),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export class UserTimelineDto extends createZodDto(UserTimelineSchema) {}
