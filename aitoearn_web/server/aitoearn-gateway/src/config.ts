import { createZodDto, selectConfig } from '@common/utils'
import { s3ConfigSchema } from '@libs/aws-s3/s3.config'
import { mailConfigSchema } from '@libs/mail/mail.config'
import { mcpConfigSchema } from '@libs/mcp/mcp.config'
import { redisConfigSchema } from '@libs/redis/redis.config'
import { tmsConfigSchema } from '@libs/tms/tms.config'
import { natsConfigSchema } from '@transports/nats.config'
import { z } from 'zod/v4'

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

// 服务器配置
const serverConfigSchema = z.object({
  port: z.number().default(7000),
  docs: z
    .object({
      enabled: z.boolean().default(false),
      path: z.string().default('/doc'),
    })
    .optional(),
  globalPrefix: z.string().default('/api'),
  enableBadRequestDetails: z.boolean().default(false),
})

// 数据库配置
const mongoConfigSchema = z.object({
  uri: z.string().default(''),
  dbName: z.string().default(''),
})

// 支付配置
const paymentConfigSchema = z.object({
  successfulCallback: z.string().default(''),
})

// pinterest配置
const pinterestConfigSchema = z.object({
  redirect_url: z.string().default(''),
})

// JWT配置
const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.string().default('7d'),
})

// AI配置
const aiConfigSchema = z.object({
  qwenKey: z.string().default(''),
})

export const configSchema = z.object({
  logger: loggerConfigSchema.default({}),
  ...serverConfigSchema.shape,
  redis: redisConfigSchema,
  mongodb: mongoConfigSchema,
  nats: natsConfigSchema,
  mail: mailConfigSchema,
  awsS3: s3ConfigSchema,
  mcp: mcpConfigSchema.optional(),
  tms: tmsConfigSchema,
  payment: paymentConfigSchema,
  jwt: jwtConfigSchema,
  ai: aiConfigSchema,
  environment: z.string().default('development'),
  mailBackHost: z.string(),
  pinterest: pinterestConfigSchema,
  channelAuthBackUrl: z.string(),
})

export class AppConfig extends createZodDto(configSchema) {}

export const config = selectConfig(AppConfig)
