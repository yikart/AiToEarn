/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: interact
 */
import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const AddArcCommentSchema = z.object({
  accountId: z.string({ message: '账号ID' }),
  dataId: z.string({ message: '作品ID' }),
  content: z.string({ message: '内容' }),
})
export class AddArcCommentDto extends createZodDto(AddArcCommentSchema) {}

const ReplyCommentSchema = z.object({
  accountId: z.string({ message: '账号ID' }),
  commentId: z.string({ message: '评论ID' }),
  content: z.string({ message: '内容' }),
})
export class ReplyCommentDto extends createZodDto(ReplyCommentSchema) {}

const DelCommentSchema = z.object({
  accountId: z.string({ message: '账号ID' }),
  commentId: z.string({ message: '评论ID' }),
})
export class DelCommentDto extends createZodDto(DelCommentSchema) {}
