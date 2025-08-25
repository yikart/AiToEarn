import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const redisConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  db: z.number().optional(),
  connectTimeout: z.number().default(10000),
})

export class RedisConfig extends createZodDto(redisConfigSchema) {}
