import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const geminiVeoVideoCreateResponseSchema = z.object({
  id: z.string(),
  operationName: z.string(),
  status: z.enum(['generating', 'completed', 'failed']),
  model: z.string(),
  error: z.string().optional(),
})

export class GeminiVeoVideoCreateResponseVo extends createZodDto(geminiVeoVideoCreateResponseSchema) {}

const geminiVeoVideoStatusResponseSchema = z.object({
  id: z.string(),
  operationName: z.string(),
  status: z.enum(['generating', 'completed', 'failed']),
  model: z.string(),
  progress: z.number(),
  url: z.string().optional(),
  video_url: z.string().optional(),
  created_at: z.number(),
  completed_at: z.number().nullable(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).nullable().optional(),
})

export class GeminiVeoVideoStatusResponseVo extends createZodDto(geminiVeoVideoStatusResponseSchema) {}
