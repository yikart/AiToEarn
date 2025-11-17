import { AccountType, createZodDto } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import z from 'zod'

export const FetchPostsRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  uid: z.string().describe('userId, account表中的uid字段'),
  page: z.number().min(1).default(1).describe('页码，默认1'),
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，默认20，最大100'),
})

export class FetchPostsRequestDto extends createZodDto(FetchPostsRequestSchema) { }

export const FetchPostsBatchRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  postIds: z.array(z.string()).describe('作品 postId 数组'),
  page: z.number().min(1).default(1).describe('页码，默认1'),
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，默认20，最大100'),
})

export class FetchPostsBatchRequestDto extends createZodDto(FetchPostsBatchRequestSchema) { }

export const FetchPostRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台'),
  postId: z.string().describe('作品 postId'),
})

export class FetchPostRequestDto extends createZodDto(FetchPostRequestSchema) { }

export const FetchAllPostsRequestSchema = z.object({
  platform: z.enum(AccountType).describe('平台').optional(),
  userId: z.string().describe('userId, account表中的userId字段'),
  uid: z.string().optional().describe('userId, account表中的uid字段'),
  period: z.tuple([z.date(), z.date()]).optional().describe('数据查询时间范围，默认查询所有'),
  status: z.enum(PublishStatus).optional().describe('发布状态，默认查询所有'),
})

export class FetchAllPostsRequestDto extends createZodDto(FetchAllPostsRequestSchema) { }
