import { createZodDto } from '@yikart/common'
import { redisConfigSchema } from '@yikart/redis'
import { z } from 'zod'

/**
 * Job 选项配置 Schema
 */
const removeOnJobSchema = z.union([
  z.boolean(),
  z.object({
    age: z.number().describe('保留时长（秒）'),
    count: z.number().describe('保留最大数量'),
  }),
])

export const jobOptionsSchema = z.object({
  /** 完成后移除 */
  removeOnComplete: removeOnJobSchema.default({ age: 30, count: 1000 }),
  /** 失败后移除 */
  removeOnFail: removeOnJobSchema.default({ age: 60, count: 1000 }),
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
