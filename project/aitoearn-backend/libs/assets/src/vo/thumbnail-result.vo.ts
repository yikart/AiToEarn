import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ThumbnailResultVoSchema = z.object({
  thumbnailUrl: z.string(),
})
export class ThumbnailResultVo extends createZodDto(ThumbnailResultVoSchema, 'ThumbnailResultVo') {}
