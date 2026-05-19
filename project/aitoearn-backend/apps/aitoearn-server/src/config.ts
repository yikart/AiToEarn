import { aitoearnAiClientConfigSchema } from '@yikart/aitoearn-ai-client'
import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { aliSmsConfigSchema } from '@yikart/ali-sms'
import { assetsConfigSchema } from '@yikart/assets'
import { mongodbConfigSchema as channelDbConfigSchema } from '@yikart/channel-db'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import z from 'zod'

const mailConfigSchema = z.object({
  transport: z.object({
    host: z.string().default(''),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().default(''),
      pass: z.string().default(''),
    }),
  }),
  defaults: z.object({
    from: z.string().default(''),
  }),
  template: z.object({
    dir: z.string().default(''),
    adapter: z.any().optional(),
    options: z.object({
      strict: z.boolean().default(true),
    }).optional(),
  }).optional(),
})

const moreApiConfigSchema = z.object({
  platApiUri: z.string().default(''),
})

export const newApiConfigSchema = z.object({
  baseUrl: z.string(),
  token: z.string(),
})

const BilibiliSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const DouyinSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const kwaiSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const GoogleSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  authBackHost: z.string().default(''),
})

const GoogleBusinessSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default(''),
})

const PinterestSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  baseUrl: z.string().default(''),
  authBackHost: z.string().default(''),
  test_authorization: z.string().default(''),
})

const TiktokSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

const TwitterPricingSchema = z.object({
  read: z.object({
    post: z.number().default(0.5),
    user: z.number().default(1),
    media: z.number().default(0.5),
    list: z.number().default(0.5),
  }),
  write: z.object({
    contentCreate: z.number().default(1.5),
    contentCreateWithUrl: z.number().default(20),
    interactionCreate: z.number().default(1.5),
    interactionDelete: z.number().default(1),
    contentManage: z.number().default(0.5),
    bookmark: z.number().default(0.5),
    mediaMetadata: z.number().default(0.5),
  }),
})

const TwitterSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default(''),
  pricing: TwitterPricingSchema.default({
    read: {
      post: 0.5,
      user: 1,
      media: 0.5,
      list: 0.5,
    },
    write: {
      contentCreate: 1.5,
      contentCreateWithUrl: 20,
      interactionCreate: 1.5,
      interactionDelete: 1,
      contentManage: 0.5,
      bookmark: 0.5,
      mediaMetadata: 0.5,
    },
  }),
})

const WxPlatSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  token: z.string().default(''),
  encodingAESKey: z.string().default(''),
  authBackHost: z.string().default(''),
})

const MyWxPlatSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  hostUrl: z.string().default(''),
})

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

export const relayConfigSchema = z.object({
  serverUrl: z.string().url().describe('中转服务器地址'),
  apiKey: z.string().describe('用户 API Key'),
  callbackUrl: z.string().url().describe('OAuth 回调完整地址，如 http://localhost:3000/api/plat/relay-callback'),
})

export const channelConfigSchema = z.object({
  channelDb: channelDbConfigSchema,
  moreApi: moreApiConfigSchema,
  shortLink: z.object({
    baseUrl: z.string().default(''),
  }),
  bilibili: BilibiliSchema,
  douyin: DouyinSchema,
  kwai: kwaiSchema,
  google: GoogleSchema,
  googleBusiness: GoogleBusinessSchema.optional(),
  pinterest: PinterestSchema,
  tiktok: TiktokSchema,
  twitter: TwitterSchema,
  oauth: MetaOAuth2ConfigSchema,
  wxPlat: WxPlatSchema,
  myWxPlat: MyWxPlatSchema,
  youtube: YoutubeSchema,
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  environment: z.enum(['development', 'production']).default('development'),
  superCode: z.string().optional(),
  auth: aitoearnAuthConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  aliSms: aliSmsConfigSchema,
  assets: assetsConfigSchema,
  mail: mailConfigSchema,
  aiClient: aitoearnAiClientConfigSchema,
  newApi: newApiConfigSchema.optional(),
  channel: channelConfigSchema,
  relay: relayConfigSchema.optional(),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
