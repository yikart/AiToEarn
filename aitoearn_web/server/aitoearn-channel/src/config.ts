import { createZodDto, selectConfig } from '@common/utils'
import { z } from 'zod/v4'

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

// OSS配置
const OssOptionSchema = z.object({
  region: z.string().default(''),
  accessKeyId: z.string().default(''),
  accessKeySecret: z.string().default(''),
  bucket: z.string().default(''),
  secret: z.string().default('true'),
})
const OssConfigSchema = z.object({
  options: OssOptionSchema,
  hostUrl: z.string().default('nats://127.0.0.1:4222'),
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

// youtube配置
const YoutubeSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const OAuth2ConfigSchema = z.object({
  pkce: z.boolean().default(false),
  shortLived: z.boolean().default(true),
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  configId: z.string().default(''),
  appId: z.string().default(''),
  redirectUri: z.string().default(''),
  apiBaseUrl: z.string().default(''),
  authURL: z.string().default(''),
  accessTokenURL: z.string().default(''),
  longLivedAccessTokenURL: z.string().default(''),
  refreshTokenURL: z.string().default(''),
  userProfileURL: z.string().default(''),
  pageAccountURL: z.string().default(''),
  requestAccessTokenMethod: z.string().default('POST'),
  defaultScopes: z.array(z.string()).default([]),
  longLivedGrantType: z.string().default(''),
  longLivedParamsMap: z.record(z.string(), z.string()).default({}),
  scopesSeparator: z.string().default(' '),
})

const MetaOAuth2ConfigSchema = z.object({
  facebook: OAuth2ConfigSchema,
  threads: OAuth2ConfigSchema,
  instagram: OAuth2ConfigSchema,
})

export const configSchema = z.object({
  ...serverConfigSchema.shape,
  redis: redisConfigSchema,
  mongodb: mongoConfigSchema,
  nats: natsConfigSchema,
  oss: OssConfigSchema,
  bullmq: BullmqSchema,
  bilibili: BilibiliSchema,
  kwai: kwaiSchema,
  google: GoogleSchema,
  pinterest: PinterestSchema,
  tiktok: TiktokSchema,
  twitter: TwitterSchema,
  wxPlat: WxPlatSchema,
  youtube: YoutubeSchema,
  meta: MetaOAuth2ConfigSchema,
})

export class AppConfig extends createZodDto(configSchema) {}

export const config = selectConfig(AppConfig)
