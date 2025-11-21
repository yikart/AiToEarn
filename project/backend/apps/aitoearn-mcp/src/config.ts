import { s3ConfigSchema } from '@yikart/aws-s3'
import { createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import { z } from 'zod'

const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])

export const cloudWatchLoggerConfig = z.object({
  enable: z.boolean().default(false),
  level: logLevel.default('debug'),
  region: z.string(),
  group: z.string(),
  stream: z.string().optional(),
  entity: z.object({
    keyAttributes: z.record(z.string(), z.string()).optional(),
    attributes: z.record(z.string(), z.string()).optional(),
  }).optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
})

export const consoleLoggerConfig = z.object({
  enable: z.boolean().default(true),
  level: logLevel.default('info'),
  singleLine: z.boolean().default(false),
  translateTime: z.boolean().default(true),
})

export const loggerConfig = z.object({
  cloudWatch: cloudWatchLoggerConfig.optional(),
  console: consoleLoggerConfig.optional(),
})

export const baseConfig = z.object({
  globalPrefix: z.string().optional(),
  port: z.number().int().default(3000),
  enableBadRequestDetails: z.boolean().default(false),
  logger: loggerConfig.optional(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  awsS3: s3ConfigSchema,
  environment: z.string().default('development'),
  enableConfigLogging: z.boolean().default(false),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
