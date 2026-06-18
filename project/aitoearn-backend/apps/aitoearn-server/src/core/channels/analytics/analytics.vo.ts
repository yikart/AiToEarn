import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ChannelAccountProfileSnapshotVoSchema = z.object({
  displayName: z.string().optional().describe('平台展示名称'),
  username: z.string().optional().describe('平台用户名'),
  avatarUrl: z.string().optional().describe('头像 URL'),
  accountType: z.string().optional().describe('平台账号类型'),
})

export const ChannelAccountMetricsSnapshotVoSchema = z.object({
  fansCount: z.number().optional().describe('粉丝数'),
  followingCount: z.number().optional().describe('关注数'),
  workCount: z.number().optional().describe('作品数'),
  readCount: z.number().optional().describe('阅读数'),
  viewCount: z.number().optional().describe('浏览数'),
  impressionCount: z.number().optional().describe('曝光数'),
  reachCount: z.number().optional().describe('触达数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  forwardCount: z.number().optional().describe('转发数'),
  commentCount: z.number().optional().describe('评论数'),
  clickCount: z.number().optional().describe('点击数'),
  engagementCount: z.number().optional().describe('互动数'),
})

export const ChannelWorkSnapshotVoSchema = z.object({
  id: z.string().describe('平台作品 ID'),
  url: z.string().optional().describe('作品链接'),
  title: z.string().optional().describe('作品标题'),
  description: z.string().optional().describe('作品描述'),
  mediaType: z.string().optional().describe('作品媒体类型'),
  coverUrl: z.string().optional().describe('封面 URL'),
  publishedAt: z.date().optional().describe('发布时间'),
  status: z.string().optional().describe('作品状态'),
  author: z.string().optional().describe('作者'),
})

export const ChannelWorkMetricsSnapshotVoSchema = z.object({
  viewCount: z.number().optional().describe('浏览数'),
  playCount: z.number().optional().describe('播放数'),
  impressionCount: z.number().optional().describe('曝光数'),
  reachCount: z.number().optional().describe('触达数'),
  likeCount: z.number().optional().describe('点赞数'),
  collectCount: z.number().optional().describe('收藏数'),
  commentCount: z.number().optional().describe('评论数'),
  shareCount: z.number().optional().describe('分享数'),
  saveCount: z.number().optional().describe('保存数'),
  clickCount: z.number().optional().describe('点击数'),
  engagementCount: z.number().optional().describe('互动数'),
  watchTimeSeconds: z.number().optional().describe('观看时长秒数'),
})

export const ChannelAccountDataSnapshotVoSchema = z.object({
  id: z.string().optional().describe('快照 ID'),
  platformUid: z.string().optional().describe('平台账号 UID'),
  snapshotAt: z.date().describe('快照对应时间'),
  fetchedAt: z.date().describe('平台数据获取时间'),
  periodStartAt: z.date().optional().describe('区间开始时间'),
  periodEndAt: z.date().optional().describe('区间结束时间'),
  profile: ChannelAccountProfileSnapshotVoSchema.optional().describe('账号资料'),
  metrics: ChannelAccountMetricsSnapshotVoSchema.optional().describe('账号指标'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台特殊字段'),
})

export const ChannelWorkDataSnapshotVoSchema = z.object({
  id: z.string().optional().describe('快照 ID'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  snapshotAt: z.date().describe('快照对应时间'),
  fetchedAt: z.date().describe('平台数据获取时间'),
  periodStartAt: z.date().optional().describe('区间开始时间'),
  periodEndAt: z.date().optional().describe('区间结束时间'),
  work: ChannelWorkSnapshotVoSchema.describe('作品资料'),
  metrics: ChannelWorkMetricsSnapshotVoSchema.optional().describe('作品指标'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台特殊字段'),
})

export const ChannelAccountAnalyticsVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  accountId: z.string().describe('账号 ID'),
  profile: ChannelAccountProfileSnapshotVoSchema.optional().describe('账号资料'),
  metrics: ChannelAccountMetricsSnapshotVoSchema.optional().describe('账号指标'),
  snapshots: z.array(ChannelAccountDataSnapshotVoSchema).default([]).describe('本次保存的账号数据快照'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台特殊字段'),
  snapshotId: z.string().optional().describe('本次主快照 ID'),
  fetchedAt: z.date().optional().describe('平台数据获取时间'),
  message: z.string().optional().describe('提示信息'),
})

export class ChannelAccountAnalyticsVo extends createZodDto(
  ChannelAccountAnalyticsVoSchema,
  'ChannelAccountAnalyticsVo',
) {}

export const ChannelWorkAnalyticsVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  accountId: z.string().optional().describe('账号 ID'),
  platformWorkId: z.string().describe('平台作品 ID'),
  work: ChannelWorkSnapshotVoSchema.optional().describe('作品资料'),
  metrics: ChannelWorkMetricsSnapshotVoSchema.optional().describe('作品指标'),
  snapshots: z.array(ChannelWorkDataSnapshotVoSchema).default([]).describe('本次保存的作品数据快照'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台特殊字段'),
  snapshotId: z.string().optional().describe('本次主快照 ID'),
  fetchedAt: z.date().optional().describe('平台数据获取时间'),
  message: z.string().optional().describe('提示信息'),
})

export class ChannelWorkAnalyticsVo extends createZodDto(
  ChannelWorkAnalyticsVoSchema,
  'ChannelWorkAnalyticsVo',
) {}
