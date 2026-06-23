import { AccountType, createZodDto } from '@yikart/common'
import { PublishRecordLinkStatus, PublishStatus } from '@yikart/mongodb'
import { z } from 'zod'

export const ChannelPublishFlowTaskVoSchema = z.object({
  id: z.string().describe('发布任务 ID'),
  accountId: z.string().describe('账号 ID'),
  platform: z.enum(AccountType).describe('平台'),
  status: z.enum(PublishStatus).optional().describe('发布状态'),
  publishTime: z.coerce.date().optional().describe('发布时间'),
  platformWorkId: z.string().optional().describe('平台作品 ID'),
  workLink: z.string().optional().describe('作品链接'),
  linkStatus: z.enum(PublishRecordLinkStatus).optional().describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
  errorMsg: z.string().optional().describe('错误信息'),
})

export const ChannelPublishFlowVoSchema = z.object({
  flowId: z.string().describe('发布 Flow ID'),
  tasks: z.array(ChannelPublishFlowTaskVoSchema).describe('发布任务列表'),
})

export class ChannelPublishFlowVo extends createZodDto(
  ChannelPublishFlowVoSchema,
  'ChannelPublishFlowVo',
) {}
