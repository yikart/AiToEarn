import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const mailConfigSchema = z.object({
  transport: z.object({
    host: z.string().default(''),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().default(''),
      pass: z.string().default(''),
    }),
  }),
  defaults: z.object({
    from: z.string().default(''),
  }),
  template: z.any().optional(),
})

export class MailConfig extends createZodDto(mailConfigSchema) {}
