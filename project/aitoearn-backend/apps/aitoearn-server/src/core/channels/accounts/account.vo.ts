import { AccountType, createZodDto, FileUtil } from '@yikart/common'
import { AccountStatus, ClientType } from '@yikart/mongodb'
import { z } from 'zod'

export const ChannelAccountVoSchema = z.object({
  id: z.string().describe('账号 ID'),
  userId: z.string().describe('用户 ID'),
  type: z.enum(AccountType).describe('平台'),
  clientType: z.enum(ClientType).optional().describe('客户端类型'),
  uid: z.string().describe('平台账号 UID'),
  account: z.string().optional().describe('平台账号名'),
  loginTime: z.coerce.date().optional().describe('登录时间'),
  avatar: FileUtil.zodBuildUrl().optional().describe('头像 URL'),
  nickname: z.string().describe('昵称'),
  fansCount: z.number().optional().describe('粉丝数'),
  followingCount: z.number().optional().describe('关注数'),
  readCount: z.number().optional().describe('阅读数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  forwardCount: z.number().optional().describe('转发数'),
  commentCount: z.number().optional().describe('评论数'),
  lastStatsTime: z.coerce.date().optional().describe('最近统计时间'),
  workCount: z.number().optional().describe('作品数'),
  income: z.number().optional().describe('收入'),
  groupId: z.string().describe('账号分组 ID'),
  status: z.coerce.number().pipe(z.enum(AccountStatus)).describe('账号状态'),
  rank: z.number().optional().describe('排序值'),
  relayAccountRef: z.string().nullable().optional().describe('转发账号引用'),
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})

export class ChannelAccountVo extends createZodDto(ChannelAccountVoSchema, 'ChannelAccountVo') {}

export const ChannelAccountListVoSchema = z.object({
  total: z.number().describe('账号总数'),
  list: z.array(ChannelAccountVoSchema).describe('账号列表'),
})

export class ChannelAccountListVo extends createZodDto(ChannelAccountListVoSchema, 'ChannelAccountListVo') {}

export const ChannelAccountAuthStatusVoSchema = z.object({
  status: z.coerce.number().pipe(z.enum(AccountStatus)).describe('账号授权状态'),
})

export class ChannelAccountAuthStatusVo extends createZodDto(
  ChannelAccountAuthStatusVoSchema,
  'ChannelAccountAuthStatusVo',
) {}
