import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const RedlockConfigSchema = z.object({
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
    keyPrefix: z.string().default(''),
  }),
  ttl: z.number().optional().default(300),
  retryDelay: z.number().optional().default(1000),
  retryCount: z.number().optional().default(3),
})

export type RedlockConfigInput = z.input<typeof RedlockConfigSchema>

export class RedlockConfig extends createZodDto(RedlockConfigSchema) {}
