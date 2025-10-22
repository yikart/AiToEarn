import { createZodDto } from '@yikart/common'
import { AccountStatus, AccountType } from '@yikart/task-db'
import { z } from 'zod'
import { filterSetSchema } from '../../common/filter-set.dto'

export const reportAccountPortraitSchema = z.object({
  accountId: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(AccountType),
  uid: z.string(),
  avatar: z.string().optional(),
  nickname: z.string().optional(),
  status: z.enum(AccountStatus).optional(),
  contentTags: z.record(z.string(), z.number().min(0)).optional().default({}),
  totalFollowers: z.number().min(0).optional().default(0),
  totalWorks: z.number().min(0).optional().default(0),
  totalViews: z.number().min(0).optional().default(0),
  totalLikes: z.number().min(0).optional().default(0),
  totalCollects: z.number().min(0).optional().default(0),
  userPortrait: z.any().optional(),
})
export class ReportAccountPortraitDto extends createZodDto(reportAccountPortraitSchema) { }

export const accountPortraitListQuerySchema = z.object({
  filter: z.object({
    keyword: z.string().optional(),
    taskId: z.string().optional(),
    rule: filterSetSchema.optional(),
  }),
  page: z.object({
    pageNo: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
  }),
})
export class AccountPortraitListQueryDto extends createZodDto(accountPortraitListQuerySchema) { }

export const getAccountPortraitSchema = z.object({
  accountId: z.string(),
})

export class GetAccountPortraitDto extends createZodDto(getAccountPortraitSchema) { }
