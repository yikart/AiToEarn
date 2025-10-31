import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AddReplyCommentRecordSchema = z.object({
  accountId: z.string().min(1, { message: '账号ID不能为空' }),
  type: z.enum(AccountType, { message: '账号类型不能为空' }),
  commentId: z.string().min(1, { message: '评论ID不能为空' }),
  worksId: z.string().optional(),
  commentContent: z.string().min(1, { message: '评论内容不能为空' }),
  replyContent: z.string().min(1, { message: '回复内容不能为空' }),
})
export class AddReplyCommentRecordDto extends createZodDto(AddReplyCommentRecordSchema) {}

export const ReplyCommentRecordFiltersSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(AccountType).optional(),
  commentId: z.string().optional(),
  time: z.tuple([z.date(), z.date()]).optional(),
})
export class ReplyCommentRecordFiltersDto extends createZodDto(ReplyCommentRecordFiltersSchema) {}

export const ReplyCommentRecordListSchema = z.object({
  filters: ReplyCommentRecordFiltersSchema,
  page: z.object({
    pageNo: z.number().min(1, { message: '页码不能小于1' }),
    pageSize: z.number().min(1, { message: '页大小不能小于1' }),
  }),
})
export class ReplyCommentRecordListDto extends createZodDto(ReplyCommentRecordListSchema) {}
