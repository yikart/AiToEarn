import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { z } from 'zod'
import { s3ConfigSchema } from './libs/aws-s3/s3.config'

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

// bullmq配置
const BullmqConnectionSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().default(6379),
  password: z.string().default(''),
  db: z.number().default(0),
})
const BullmqSchema = z.object({
  connection: BullmqConnectionSchema,
  prefix: z.string().optional(),
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
  scopes: z.array(z.string()).default([]),
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
  scopes: z.array(z.string()).default([]),
})

const MetaOAuth2ConfigSchema = z.object({
  facebook: OAuth2ConfigSchema,
  threads: OAuth2ConfigSchema,
  instagram: OAuth2ConfigSchema,
  linkedin: OAuth2ConfigSchema,
})

const AliGreenConfigSchema = z.object({
  accessKeyId: z.string().default(''),
  accessKeySecret: z.string().default(''),
  endpoint: z.string().default(''),
})

export const configSchema = z.object({
  gateway: z.string(),
  ...baseConfig.shape,
  redis: redisConfigSchema,
  mongodb: mongoConfigSchema,
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
  oauth: MetaOAuth2ConfigSchema,
  aliGreen: AliGreenConfigSchema,
})

export class AppConfig extends createZodDto(configSchema) {}

export const config = selectConfig(AppConfig)
