import { createZodDto, selectConfig } from '@common/utils'
import { z } from 'zod/v4'

// 服务器配置
const serverConfigSchema = z.object({
  port: z.number().default(3000),
  docs: z
    .object({
      enabled: z.boolean().default(true),
      path: z.string().default('/doc'),
    })
    .optional(),
  enableBadRequestDetails: z.boolean().default(false),
})

// Redis配置
const redisConfigSchema = z.object({
  name: z.string().default('default'),
  host: z.string().default('127.0.0.1'),
  port: z.number().default(6379),
  password: z.string().default(''),
  db: z.number().default(0),
  connectTimeout: z.number().default(10000),
})

// MongoDB配置
const mongoConfigSchema = z.object({
  uri: z.string().default(''),
  dbName: z.string().default(''),
})

// NATS配置
const natsConfigSchema = z.object({
  name: z.string().default(''),
  servers: z.array(z.string()).default(['nats://127.0.0.1:4222']),
  user: z.string().default(''),
  pass: z.string().default(''),
  prefix: z.string().default(''),
})

const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])

export const cloudWatchLoggerConfigSchema = z.object({
  enable: z.boolean().default(false),
  level: logLevelSchema.default('debug'),
  region: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  group: z.string(),
  stream: z.string().optional(),
  prefix: z.string().optional(),
})

export const consoleLoggerConfigSchema = z.object({
  enable: z.boolean().default(true),
  colorize: z.boolean().default(true),
  level: logLevelSchema.default('info'),
  singleLine: z.boolean().default(false),
  translateTime: z.boolean().default(true),
})

export const loggerConfigSchema = z.object({
  cloudWatch: cloudWatchLoggerConfigSchema.optional(),
  console: consoleLoggerConfigSchema.optional(),
})

export const configSchema = z.object({
  logger: loggerConfigSchema.default({}),
  ...serverConfigSchema.shape,
  redis: redisConfigSchema,
  mongodb: mongoConfigSchema,
  nats: natsConfigSchema,
})

export class AppConfig extends createZodDto(configSchema) { }

export const config = selectConfig(AppConfig)
