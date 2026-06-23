import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ChannelWorkDataSnapshotVoSchema, ChannelWorkMetricsSnapshotVoSchema, ChannelWorkSnapshotVoSchema } from '../analytics/analytics.vo'
import { ChannelPaginationResultVoSchema } from '../platforms/platform-pagination.vo'
import { PublishContentMode } from '../platforms/platforms.interface'

export const ChannelWorkDataVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  work: ChannelWorkSnapshotVoSchema.optional().describe('作品资料'),
  snapshots: z.array(ChannelWorkDataSnapshotVoSchema).default([]).describe('本次保存的作品数据快照'),
  extra: z.record(z.string(), z.unknown()).optional().describe('平台特殊字段'),
  snapshotId: z.string().optional().describe('本次主快照 ID'),
  fetchedAt: z.coerce.date().optional().describe('平台数据获取时间'),
  message: z.string().optional().describe('提示信息'),
})

export class ChannelWorkDataVo extends createZodDto(
  ChannelWorkDataVoSchema,
  'ChannelWorkDataVo',
) {}

export const ChannelWorkOwnershipVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  owned: z.boolean().describe('作品是否归属该账号'),
  message: z.string().optional().describe('提示信息'),
})

export class ChannelWorkOwnershipVo extends createZodDto(
  ChannelWorkOwnershipVoSchema,
  'ChannelWorkOwnershipVo',
) {}

export const ChannelWorkListItemVoSchema = z.object({
  platformWorkId: z.string().describe('平台作品 ID'),
  contentMode: z.enum(PublishContentMode).describe('作品内容类型'),
  title: z.string().optional().describe('作品标题'),
  description: z.string().optional().describe('作品描述'),
  url: z.string().optional().describe('作品链接'),
  coverUrl: z.string().optional().describe('封面 URL'),
  publishedAt: z.coerce.date().optional().describe('发布时间'),
  authorName: z.string().optional().describe('作者名称'),
  authorPlatformUid: z.string().optional().describe('作者平台 UID'),
  status: z.string().optional().describe('作品状态'),
  metrics: ChannelWorkMetricsSnapshotVoSchema.optional().describe('作品指标'),
})

export const ChannelWorkListVoSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  items: z.array(ChannelWorkListItemVoSchema).describe('作品列表'),
  pagination: ChannelPaginationResultVoSchema.describe('分页结果'),
})

export class ChannelWorkListVo extends createZodDto(
  ChannelWorkListVoSchema,
  'ChannelWorkListVo',
) {}
