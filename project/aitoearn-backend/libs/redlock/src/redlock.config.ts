import { createZodDto } from '@yikart/common'
import { redisConfigSchema } from '@yikart/redis'
import { z } from 'zod'

export const redlockConfigSchema = z.object({
  redis: redisConfigSchema,
  ttl: z.number().optional().default(300),
  retryDelay: z.number().optional().default(1000),
  retryCount: z.number().optional().default(3),
})

export class RedlockConfig extends createZodDto(redlockConfigSchema) {}
