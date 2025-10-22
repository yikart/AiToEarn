import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const tableSchema = z.object({
  pageNo: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const adminTaskOpportunityListFilterSchema = z.object({
  taskId: z.string(),
  userId: z.string().optional(),
})
export const adminTaskOpportunityListSchema = z.object({
  page: tableSchema,
  filter: adminTaskOpportunityListFilterSchema,
})
export class AdminTaskOpportunityListDto extends createZodDto(adminTaskOpportunityListSchema) {}
