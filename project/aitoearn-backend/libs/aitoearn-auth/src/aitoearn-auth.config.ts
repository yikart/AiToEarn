import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const aitoearnAuthConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
  internalToken: z.string(),
})

export class AitoearnAuthConfig extends createZodDto(aitoearnAuthConfigSchema) {}
