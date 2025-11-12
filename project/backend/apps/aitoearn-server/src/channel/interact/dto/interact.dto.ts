import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AddArcCommentSchema = z.object({
  accountId: z.string().min(1, { message: '账号ID不能为空' }),
  dataId: z.string().min(1, { message: '作品ID不能为空' }),
  content: z.string().describe('内容'),
})
export class AddArcCommentDto extends createZodDto(AddArcCommentSchema) {}

export const ReplyCommentSchema = z.object({
  accountId: z.string().min(1, { message: '账号ID不能为空' }),
  commentId: z.string().min(1, { message: '评论ID不能为空' }),
  content: z.string().describe('内容'),
})
export class ReplyCommentDto extends createZodDto(ReplyCommentSchema) {}

export const DelCommentSchema = z.object({
  accountId: z.string().min(1, { message: '账号ID不能为空' }),
  commentId: z.string().min(1, { message: '评论ID不能为空' }),
})
export class DelCommentDto extends createZodDto(DelCommentSchema) {}
