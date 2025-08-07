import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const redisConfigSchema = z.object({
  name: z.string().default('default'),
  host: z.string().default('127.0.0.1'),
  port: z.number().default(6379),
  password: z.string().default(''),
  db: z.number().default(0),
  connectTimeout: z.number().default(10000),
})

export class RedisConfig extends createZodDto(redisConfigSchema) {}
