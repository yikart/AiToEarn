import { z } from 'zod'

export const redisConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  db: z.number().optional(),
  tls: z.record(z.string(), z.any()).optional(),
}).or(z.object({
  nodes: z.object({
    host: z.string().optional(),
    post: z.string().optional(),
  }).array(),
  options: z.object({
    enableOfflineQueue: z.boolean().optional(),
    enableReadyCheck: z.boolean().optional(),
    lazyConnect: z.boolean().optional(),
    redisOptions: z.record(z.string(), z.any()),
  }),
}))

export type RedisConfig = z.infer<typeof redisConfigSchema>
