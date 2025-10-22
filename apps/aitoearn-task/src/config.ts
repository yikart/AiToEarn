import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import z from 'zod'

// BullMQ配置
const bullmqConfigSchema = z.object({
  defaultJobOptions: z.object({
    removeOnComplete: z.number().default(10),
    removeOnFail: z.number().default(5),
    attempts: z.number().default(3),
    backoff: z.object({
      type: z.string().default('exponential'),
      delay: z.number().default(2000),
    }),
  }),
  connection: z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number().default(6379),
    password: z.string().default(''),
    db: z.number().default(0),
  }),
})
export const appConfigSchema = z.object({
  ...baseConfig.shape,
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
    connectTimeout: z.number().optional().default(10000),
  }),
  taskDb: mongodbConfigSchema,
  environment: z.string().default('development'),
  bullmq: bullmqConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
