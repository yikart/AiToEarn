import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'
import { ChannelPaginationInputWithDefaultSchema } from '../platforms/platform-pagination.dto'

export const WorkPlatformParamsSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  platformWorkId: z.string().min(1).describe('平台作品 ID'),
})

export class WorkPlatformParamsDto extends createZodDto(WorkPlatformParamsSchema) {}

export const WorkListPlatformParamsSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
})

export class WorkListPlatformParamsDto extends createZodDto(WorkListPlatformParamsSchema) {}

export const WorkLinkInfoQuerySchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  link: z.string().min(1).describe('作品链接'),
  accountId: z.string().min(1).optional().describe('账号 ID'),
})

export class WorkLinkInfoQueryDto extends createZodDto(WorkLinkInfoQuerySchema) {}

export const WorkAccountQuerySchema = z.object({
  accountId: z.string().min(1).optional().describe('账号 ID'),
})

export class WorkAccountQueryDto extends createZodDto(WorkAccountQuerySchema) {}

export const WorkListQuerySchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  pagination: ChannelPaginationInputWithDefaultSchema.describe('分页参数'),
})

export class WorkListQueryDto extends createZodDto(WorkListQuerySchema) {}

export const WorkAnalyticsQuerySchema = WorkAccountQuerySchema.extend({
  since: z.coerce.date().optional().describe('开始时间'),
  until: z.coerce.date().optional().describe('结束时间'),
})

export class WorkAnalyticsQueryDto extends createZodDto(WorkAnalyticsQuerySchema) {}

export const WorkOwnershipBodySchema = z.object({
  candidateAccountId: z.string().min(1).describe('候选账号 ID'),
})

export class WorkOwnershipBodyDto extends createZodDto(WorkOwnershipBodySchema) {}
