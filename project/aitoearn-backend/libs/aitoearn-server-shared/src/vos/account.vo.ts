import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

import { AccountStatus, PublishRecordLinkStatus, PublishStatus, PublishType } from '../enums'

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export const AccountSchema = z.object({
  id: z.string().describe('账号 ID'),
  userId: z.string().describe('所属用户 ID'),
  type: z.enum(AccountType).describe('账号平台类型'),
  uid: z.string().describe('平台用户 UID'),
  account: z.string().describe('账号名称'),
  loginCookie: z.string().describe('登录 Cookie'),
  access_token: z.string().optional().describe('Access Token'),
  refresh_token: z.string().optional().describe('Refresh Token'),
  groupId: z.string().describe('分组 ID'),
  loginTime: z.coerce.date().optional().describe('登录时间'),
  avatar: z.string().optional().describe('头像 URL'),
  nickname: z.string().describe('昵称'),
  status: z.enum(AccountStatus).describe('账号状态'),
  channelId: z.string().optional().describe('频道 ID'),
})
export interface Account extends z.infer<typeof AccountSchema> {}

// ---------------------------------------------------------------------------
// NewAccount (kept as class for backward compatibility)
// ---------------------------------------------------------------------------

export class NewAccount {
  constructor(
    data: {
      userId: string
      type: AccountType
      uid: string
      account: string
      loginCookie?: string
      access_token?: string
      refresh_token?: string
      token?: string
      avatar?: string
      nickname: string
      lastStatsTime?: Date
      loginTime?: Date
      channelId?: string
      status?: AccountStatus
      groupId?: string
    },
  ) {
    Object.assign(this, data)
  }
}

// ---------------------------------------------------------------------------
// UpdateAccountStatisticsData
// ---------------------------------------------------------------------------

export const UpdateAccountStatisticsDataSchema = z.object({
  workCount: z.number().optional().describe('作品数'),
  fansCount: z.number().optional().describe('粉丝数'),
  readCount: z.number().optional().describe('阅读/播放数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  commentCount: z.number().optional().describe('评论数'),
  income: z.number().optional().describe('收入'),
})
export interface UpdateAccountStatisticsData extends z.infer<typeof UpdateAccountStatisticsDataSchema> {}

// ---------------------------------------------------------------------------
// PublishRecord
// ---------------------------------------------------------------------------

export const PublishRecordSchema = z.object({
  _id: z.any().describe('MongoDB _id'),
  id: z.string().describe('记录 ID'),
  userId: z.string().optional().describe('用户 ID'),
  flowId: z.string().optional().describe('流程 ID'),
  materialGroupId: z.string().optional().describe('素材组 ID'),
  materialId: z.string().optional().describe('素材 ID'),
  type: z.enum(PublishType).describe('发布类型'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  accountId: z.string().describe('账号 ID'),
  topics: z.array(z.string()).describe('话题列表'),
  accountType: z.enum(AccountType).describe('账号平台类型'),
  uid: z.string().describe('平台用户 UID'),
  videoUrl: z.string().optional().describe('视频 URL'),
  coverUrl: z.string().optional().describe('封面 URL'),
  imgUrlList: z.array(z.string()).optional().describe('图片 URL 列表'),
  publishTime: z.coerce.date().describe('发布时间'),
  status: z.enum(PublishStatus).describe('发布状态'),
  errorMsg: z.string().optional().describe('错误信息'),
  queueId: z.string().optional().describe('队列 ID'),
  inQueue: z.boolean().describe('是否在队列中'),
  option: z.any().optional().describe('额外选项'),
  dataId: z.string().optional().describe('数据 ID'),
  workLink: z.string().optional().describe('作品链接'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  linkStatus: z.enum(PublishRecordLinkStatus).optional().describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
  dataOption: z.record(z.string(), z.any()).optional().describe('数据选项'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})
export interface PublishRecord extends z.infer<typeof PublishRecordSchema> {}

export const BatchAccountStatusVoSchema = z.object({
  statuses: z.record(z.string(), z.number()).describe('账号 ID → 状态映射'),
})
export class BatchAccountStatusVo extends createZodDto(BatchAccountStatusVoSchema, 'BatchAccountStatusVo') {}

export const AccountStatisticsRefreshVoSchema = z.object({
  fansCount: z.number().optional().describe('粉丝数'),
  readCount: z.number().optional().describe('阅读/播放数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  commentCount: z.number().optional().describe('评论数'),
  workCount: z.number().optional().describe('作品数'),
  lastStatsTime: z.coerce.date().describe('最后更新时间'),
})
export class AccountStatisticsRefreshVo extends createZodDto(AccountStatisticsRefreshVoSchema, 'AccountStatisticsRefreshVo') {}

export const AggregatedAccountStatisticsVoSchema = z.object({
  accountTotal: z.number().describe('账号总数'),
  fansCount: z.number().describe('在线账号总粉丝数'),
  readCount: z.number().describe('总阅读/播放数'),
  likeCount: z.number().describe('总点赞数'),
  collectCount: z.number().describe('总收藏数'),
  commentCount: z.number().describe('总评论数'),
  forwardCount: z.number().describe('总转发数'),
  workCount: z.number().describe('总作品数'),
})
export class AggregatedAccountStatisticsVo extends createZodDto(
  AggregatedAccountStatisticsVoSchema,
  'AggregatedAccountStatisticsVo',
) {}

export const TotalFansCountVoSchema = z.object({
  totalFansCount: z.number().describe('在线账号总粉丝数：每个渠道取粉丝数最多的在线账号后求和'),
})
export class TotalFansCountVo extends createZodDto(TotalFansCountVoSchema, 'TotalFansCountVo') {}
