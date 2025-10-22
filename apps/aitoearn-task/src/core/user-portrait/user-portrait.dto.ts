import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const reportUserPortraitSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  status: z.number().optional(),
  lastLoginTime: z.string().datetime().optional(), // 验证 ISO 8601 格式，如 "2025-09-04T10:30:00Z"
  contentTags: z.record(z.string(), z.number().min(0)).optional(),
  totalFollowers: z.number().min(0).optional(),
  totalWorks: z.number().min(0).optional(),
  totalViews: z.number().min(0).optional(),
  totalLikes: z.number().min(0).optional(),
  totalCollects: z.number().min(0).optional(),
})
export class ReportUserPortraitDto extends createZodDto(reportUserPortraitSchema) {}

export const userPortraitListQuerySchema = z.object({
  filter: z.object({
    keyword: z.string().optional(),
    time: z.array(z.string().datetime()).optional(),
  }),
  page: z.object({
    pageNo: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
  }),
})
export class UserPortraitListQueryDto extends createZodDto(userPortraitListQuerySchema) {}

export const getUserPortraitSchema = z.object({
  userId: z.string(),
})

export class GetUserPortraitDto extends createZodDto(getUserPortraitSchema) {}
