import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ReplyCommentSchema = z.object({
  accountId: z.string().describe('账号ID'),
  commentId: z.string().describe('评论ID'),
  content: z.string().describe('内容'),
})
export class ReplyCommentDto extends createZodDto(ReplyCommentSchema) {}

export const DelCommentSchema = z.object({
  accountId: z.string().describe('账号ID'),
  commentId: z.string().describe('评论ID'),
})
export class DelCommentDto extends createZodDto(DelCommentSchema) {}

export const AddArcCommentSchema = z.object({
  accountId: z.string().describe('账号ID'),
  dataId: z.string().describe('dataId不能为空'),
  content: z.string().describe('内容'),
})
export class AddArcCommentDto extends createZodDto(AddArcCommentSchema) {}

export const GetArcCommentListSchema = z.object({
  recordId: z.string().describe('记录ID'),
  pageNo: z.number().describe('页码'),
  pageSize: z.number().describe('每页数据'),
})
export class GetArcCommentListDto extends createZodDto(
  GetArcCommentListSchema,
) {}
