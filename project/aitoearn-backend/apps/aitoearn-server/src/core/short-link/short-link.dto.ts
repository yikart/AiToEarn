import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const CreateShortLinkDtoSchema = z.object({
  originalUrl: z.string().min(1),
  expiresInSeconds: z.number().int().positive().optional(),
})

export class CreateShortLinkDto extends createZodDto(CreateShortLinkDtoSchema, 'CreateShortLinkDto') {}
