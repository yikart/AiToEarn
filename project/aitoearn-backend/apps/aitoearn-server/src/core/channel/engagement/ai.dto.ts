import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string(),
  comment: z.string(),
})

export const ReplyToCommentAnswerSchema = z.object({
  id: z.string(),
  comment: z.string(),
  reply: z.string(),
})

export class comment extends createZodDto(CommentSchema) {}
export class ReplyToCommentAnswer extends createZodDto(ReplyToCommentAnswerSchema) {}
