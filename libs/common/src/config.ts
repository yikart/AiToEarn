import { z } from 'zod'

const natsConfig = z.object({
  name: z.string().optional(),
  servers: z.array(z.string()).optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
  prefix: z.string().optional(),
})

export const openapiConfig = z.object({
  enable: z.boolean().default(false),
  title: z.string().default('API Reference'),
  description: z.string().default('API Reference'),
  path: z.string().default('/docs'),
})

const logLevel = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])

export const cloudWatchLoggerConfig = z.object({
  enable: z.boolean().default(false),
  level: logLevel.default('debug'),
  group: z.string(),
  stream: z.string().optional(),
  entity: z.object({
    keyAttributes: z.record(z.string(), z.string()).optional(),
    attributes: z.record(z.string(), z.string()).optional(),
  }),
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
  openapi: openapiConfig.optional(),
  logger: loggerConfig.optional(),
  nats: natsConfig,
})

export type BaseConfig = z.infer<typeof baseConfig>
