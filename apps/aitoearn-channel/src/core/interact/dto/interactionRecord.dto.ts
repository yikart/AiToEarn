import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { AccountType } from '../../../transports/account/common'

export const AddInteractionRecordSchema = z.object({
  userId: z.string().min(1, { message: '用户ID不能为空' }),
  accountId: z.string().min(1, { message: '账号ID不能为空' }),
  type: z.enum(AccountType, { message: '账号类型不能为空' }),
  worksId: z.string().min(1, { message: '作品ID不能为空' }),
  worksTitle: z.string().optional(),
  worksCover: z.string().optional(),
  worksContent: z.string().optional(),
  commentContent: z.string().optional(),
  commentRemark: z.string().optional(),
  commentTime: z.string().optional(),
  likeTime: z.string().optional(),
  collectTime: z.string().optional(),
})
export class AddInteractionRecordDto extends createZodDto(AddInteractionRecordSchema) {}

export const InteractionRecordFiltersSchema = z.object({
  userId: z.string().min(1, { message: '用户ID不能为空' }),
  accountId: z.string().optional(),
  type: z.enum(AccountType).optional(),
  worksId: z.string().optional(),
  time: z.tuple([z.date(), z.date()]).optional(),
})

export const InteractionRecordListSchema = z.object({
  filters: InteractionRecordFiltersSchema,
  page: z.object({
    pageNo: z.number().min(1, { message: '页码不能小于1' }),
    pageSize: z.number().min(1, { message: '页大小不能小于1' }),
  }),
})
export class InteractionRecordListDto extends createZodDto(InteractionRecordListSchema) {}
