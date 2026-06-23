import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const CreateShortLinkDtoSchema = z.object({
  originalUrl: z.string().min(1),
})

export class CreateShortLinkDto extends createZodDto(CreateShortLinkDtoSchema, 'CreateShortLinkDto') {}
