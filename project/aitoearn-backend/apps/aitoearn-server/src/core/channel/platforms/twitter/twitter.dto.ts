import { createZodDto } from '@yikart/common'
import z from 'zod'

const GetAuthUrlSchema = z.object({
  scopes: z.array(z.string()).optional().describe('OAuth 权限范围'),
  spaceId: z.string().optional().describe('空间 ID'),
  callbackUrl: z.string().url().optional().describe('OAuth 完成后回调地址'),
  callbackMethod: z.enum(['GET', 'POST']).optional().describe('回调方式，默认 GET'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string().describe('授权码'),
  state: z.string().describe('状态码'),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}

const UserTimelineSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  userId: z.string().describe('用户 ID'),
  sinceId: z.string().optional().describe('起始推文 ID'),
  untilId: z.string().optional().describe('截止推文 ID'),
  maxResults: z.string().optional().describe('最大结果数'),
  paginationToken: z.string().optional().describe('分页 Token'),
  exclude: z.array(z.enum(['retweets', 'replies'])).optional().describe('排除类型'),
  startTime: z.string().optional().describe('开始时间'),
  endTime: z.string().optional().describe('结束时间'),
})
export class UserTimelineDto extends createZodDto(UserTimelineSchema) {}
