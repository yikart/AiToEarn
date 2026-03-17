import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const UploadResultVoSchema = z.object({
  id: z.string(),
  path: z.string(),
  url: z.string(),
  uploadUrl: z.string().optional(),
  uploadFields: z.record(z.string(), z.string()).optional(),
})
export class UploadResultVo extends createZodDto(UploadResultVoSchema, 'UploadResultVo') {}
