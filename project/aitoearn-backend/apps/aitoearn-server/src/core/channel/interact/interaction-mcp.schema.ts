import { AccountType } from '@yikart/common'
import { z } from 'zod'

export const createInteractionRecordSchema = z.object({
  accountId: z.string().describe('Account ID'),
  platform: z.enum(AccountType).describe('Platform'),
  worksId: z.string().describe('Work ID'),
  worksTitle: z.string().optional().describe('Work title'),
  worksCover: z.string().optional().describe('Work cover'),
  worksContent: z.string().optional().describe('Work content'),
  commentContent: z.string().optional().describe('Comment content'),
  commentRemark: z.string().optional().describe('Comment remark'),
  commentTime: z.coerce.date().optional().describe('Comment time'),
  likeTime: z.coerce.date().optional().describe('Like time'),
  collectTime: z.coerce.date().optional().describe('Favorite time'),
})

export const listInteractionRecordsSchema = z.object({
  pageNo: z.number().int().min(1).default(1).describe('Page number'),
  pageSize: z.number().int().min(1).max(100).default(20).describe('Page size'),
})

export const deleteInteractionRecordSchema = z.object({
  id: z.string().describe('Interaction record ID'),
})

export type CreateInteractionRecordParams = z.infer<typeof createInteractionRecordSchema>
export type ListInteractionRecordsParams = z.infer<typeof listInteractionRecordsSchema>
export type DeleteInteractionRecordParams = z.infer<typeof deleteInteractionRecordSchema>
