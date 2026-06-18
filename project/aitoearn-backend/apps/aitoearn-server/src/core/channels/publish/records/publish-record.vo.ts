import { AccountType, createZodDto } from '@yikart/common'
import { PublishRecordLinkStatus, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { z } from 'zod'

export const ChannelPublishRecordVoSchema = z.object({
  id: z.string().describe('发布记录 ID'),
  flowId: z.string().optional().describe('发布 Flow ID'),
  taskId: z.string().optional().describe('外部任务 ID'),
  accountId: z.string().optional().describe('账号 ID'),
  accountType: z.enum(AccountType).describe('账号平台'),
  type: z.enum(PublishType).describe('发布类型'),
  status: z.enum(PublishStatus).describe('发布状态'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('正文'),
  publishTime: z.coerce.date().describe('发布时间'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  workLink: z.string().optional().describe('作品链接'),
  linkStatus: z.enum(PublishRecordLinkStatus).optional().describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
  videoUrl: z.string().optional().describe('视频 URL'),
  coverUrl: z.string().optional().describe('封面 URL'),
  imgUrlList: z.array(z.string()).optional().describe('图片 URL 列表'),
  source: z.enum(PublishRecordSource).optional().describe('发布来源'),
  errorMsg: z.string().optional().describe('错误信息'),
  errorData: z.object({
    type: z.string().describe('错误类型'),
    code: z.string().describe('错误码'),
    message: z.string().describe('错误消息'),
  }).optional().describe('发布错误详情'),
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})

export class ChannelPublishRecordVo extends createZodDto(
  ChannelPublishRecordVoSchema,
  'ChannelPublishRecordVo',
) {}

export const ChannelPublicPublishRecordVoSchema = z.object({
  id: z.string().describe('发布记录 ID'),
  accountType: z.enum(AccountType).describe('账号平台'),
  type: z.enum(PublishType).describe('发布类型'),
  status: z.enum(PublishStatus).describe('发布状态'),
  publishTime: z.coerce.date().describe('发布时间'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  workLink: z.string().optional().describe('作品链接'),
  linkStatus: z.enum(PublishRecordLinkStatus).optional().describe('作品链接状态'),
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})

export class ChannelPublicPublishRecordVo extends createZodDto(
  ChannelPublicPublishRecordVoSchema,
  'ChannelPublicPublishRecordVo',
) {}

export const ChannelPublishUserActionVoSchema = z.object({
  recordId: z.string().describe('发布记录 ID'),
  platform: z.literal(AccountType.Douyin).describe('平台'),
  shareId: z.string().describe('抖音分享 ID'),
  schemeUrl: z.string().describe('抖音 App Scheme URL'),
  shortLink: z.string().describe('短链接'),
  expiresAt: z.coerce.date().optional().describe('过期时间'),
})

export class ChannelPublishUserActionVo extends createZodDto(
  ChannelPublishUserActionVoSchema,
  'ChannelPublishUserActionVo',
) {}
