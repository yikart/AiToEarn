import { AccountType, createZodDto } from '@yikart/common'
import { PublishRecordLinkStatus, PublishStatus } from '@yikart/mongodb'
import { z } from 'zod'

const PublishRecordTimeRangeSchema = z.preprocess(
  (value) => {
    const range = typeof value === 'string' ? value.split(',') : value
    if (!Array.isArray(range) || range.length !== 2 || typeof range[1] !== 'string') {
      return range
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(range[1])) {
      return [range[0], new Date(`${range[1]}T23:59:59.999Z`)]
    }
    return range
  },
  z.tuple([
    z.coerce.date().describe('开始时间'),
    z.coerce.date().describe('结束时间'),
  ]),
).optional().describe('发布时间范围')

export const PublishRecordAccountQuerySchema = z.object({
  accountId: z.string().optional().describe('账号 ID'),
  accountType: z.enum(AccountType).optional().describe('账号平台'),
  time: PublishRecordTimeRangeSchema,
})

export class PublishRecordAccountQueryDto extends createZodDto(PublishRecordAccountQuerySchema) {}

export const PublishRecordListQuerySchema = PublishRecordAccountQuerySchema.extend({
  status: z.coerce.number().pipe(z.enum(PublishStatus)).optional().describe('发布状态'),
})

export class PublishRecordListQueryDto extends createZodDto(PublishRecordListQuerySchema) {}

export const PublishRecordWorkLinkUpdateSchema = z.object({
  workLink: z.string().min(1).optional().describe('作品链接'),
  dataId: z.string().min(1).optional().describe('作品数据 ID'),
  platformWorkId: z.string().min(1).optional().describe('平台作品 ID'),
  linkStatus: z.enum(PublishRecordLinkStatus).default(PublishRecordLinkStatus.READY).describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
})

export class PublishRecordWorkLinkUpdateDto extends createZodDto(PublishRecordWorkLinkUpdateSchema) {}
