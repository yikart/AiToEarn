import { createZodDto, selectConfig } from '@common/utils'
import { z } from 'zod/v4'
import { s3ConfigSchema } from './libs/aws-s3/s3.config'

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
  port: z.number().default(7001),
  env: z.string().default('development'),
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

// bullmq配置
const BullmqConnectionSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().default(6379),
  password: z.string().default(''),
  db: z.number().default(0),
})
const BullmqSchema = z.object({
  connection: BullmqConnectionSchema,
})

const kwaiSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

// bilibili配置
const BilibiliSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

// google配置
const GoogleSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

// tiktok配置
const PinterestSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  baseUrl: z.string().default(''),
  authBackHost: z.string().default(''),
  test_authorization: z.string().default(''),
})

// tiktok配置
const TiktokSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default(''),
})

// twitter配置
const TwitterSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default(''),
})

// wxPlat配置
const WxPlatSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  token: z.string().default(''),
  encodingAESKey: z.string().default(''),
  authBackHost: z.string().default(''),
})

// 自建微信三方平台服务
const MyWxPlatSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  hostUrl: z.string().default(''),
})

// youtube配置
const YoutubeSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const OAuth2ConfigSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  configId: z.string().default(''),
  redirectUri: z.string().default(''),
})

const MetaOAuth2ConfigSchema = z.object({
  facebook: OAuth2ConfigSchema,
  threads: OAuth2ConfigSchema,
  instagram: OAuth2ConfigSchema,
})

export const configSchema = z.object({
  logger: loggerConfigSchema.default({}),
  ...serverConfigSchema.shape,
  redis: redisConfigSchema,
  mongodb: mongoConfigSchema,
  nats: natsConfigSchema,
  awsS3: s3ConfigSchema,
  bullmq: BullmqSchema,
  bilibili: BilibiliSchema,
  kwai: kwaiSchema,
  google: GoogleSchema,
  pinterest: PinterestSchema,
  tiktok: TiktokSchema,
  twitter: TwitterSchema,
  wxPlat: WxPlatSchema,
  myWxPlat: MyWxPlatSchema,
  youtube: YoutubeSchema,
  meta: MetaOAuth2ConfigSchema,
})

export class AppConfig extends createZodDto(configSchema) {}

export const config = selectConfig(AppConfig)
