import { createZodDto } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { z } from 'zod'

export const DouyinOfflineQrUserActionSchema = z.object({
  shareId: z.string().describe('抖音分享 ID'),
  schemeUrl: z.string().describe('抖音 App Scheme URL'),
  shortLink: z.string().describe('短链接'),
  expiresAt: z.coerce.date().describe('过期时间'),
})

export const DouyinOfflineQrPublishVoSchema = z.object({
  recordId: z.string().describe('发布记录 ID'),
  status: z.enum(PublishStatus).describe('发布状态'),
  userAction: DouyinOfflineQrUserActionSchema.describe('用户操作信息'),
})

export class DouyinOfflineQrPublishVo extends createZodDto(
  DouyinOfflineQrPublishVoSchema,
  'DouyinOfflineQrPublishVo',
) {}
