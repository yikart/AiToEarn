import { createZodDto } from '@yikart/common'
import { redisConfigSchema } from '@yikart/redis'
import { z } from 'zod'

/**
 * Job 选项配置 Schema
 */
export const jobOptionsSchema = z.object({
  /** 完成后移除，默认 true */
  removeOnComplete: z.boolean().default(true),
  /** 失败后移除，默认 true */
  removeOnFail: z.boolean().default(true),
  /** 任务超时时间（毫秒），默认 5 分钟 */
  timeout: z.number().default(5 * 60000),
})

/**
 * 队列配置 Schema
 */
export const queueConfigSchema = z.object({
  /** Redis 配置 */
  redis: redisConfigSchema,
  /** 队列前缀，默认 '{bull}' */
  prefix: z.string().default('{bull}'),
  /** Job 默认选项 */
  jobOptions: jobOptionsSchema.optional(),
})

/**
 * 队列配置类
 */
export class QueueConfig extends createZodDto(queueConfigSchema) {}
