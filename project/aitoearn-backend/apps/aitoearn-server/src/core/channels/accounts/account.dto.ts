import { AccountType, createZodDto } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { z } from 'zod'

export const ChannelAccountCreateSchema = z.object({
  type: z.enum(AccountType).describe('平台类型'),
  uid: z.string().min(1).optional().describe('平台账号 UID，不传时由平台登录凭据获取'),
  nickname: z.string().min(1).optional().describe('昵称，不传时由平台登录凭据获取'),
  avatar: z.string().optional().describe('头像 URL'),
  groupId: z.string().optional().describe('账号分组 ID'),
  loginCookie: z.string().min(1).optional().describe('平台登录 Cookie'),
})

export class ChannelAccountCreateDto extends createZodDto(ChannelAccountCreateSchema) {}

export const ChannelAccountListQuerySchema = z.object({
  ids: z.array(z.string().min(1)).optional().describe('账号 ID 数组'),
  spaceIds: z.array(z.string().min(1)).optional().describe('空间/分组 ID 数组'),
  types: z.array(z.enum(AccountType)).optional().describe('平台类型数组'),
  status: z.coerce.number().pipe(z.enum(AccountStatus)).optional().describe('账号状态'),
  groupId: z.string().optional().describe('账号分组 ID'),
})

export class ChannelAccountListQueryDto extends createZodDto(ChannelAccountListQuerySchema) {}

export const ChannelAccountDeleteQuerySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe('账号 ID 数组'),
})

export class ChannelAccountDeleteQueryDto extends createZodDto(ChannelAccountDeleteQuerySchema) {}

export const ChannelAccountAnalyticsQuerySchema = z.object({
  since: z.coerce.date().optional().describe('开始时间'),
  until: z.coerce.date().optional().describe('结束时间'),
})

export class ChannelAccountAnalyticsQueryDto extends createZodDto(ChannelAccountAnalyticsQuerySchema) {}
