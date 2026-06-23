import { aitoearnAiClientConfigSchema } from '@yikart/aitoearn-ai-client'
import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { assetsConfigSchema } from '@yikart/assets'
import { mongodbConfigSchema as channelDbConfigSchema } from '@yikart/channel-db'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import z from 'zod'
import { bilibiliConfigSchema } from './core/channels/platforms/bilibili/bilibili.config'
import { douyinConfigSchema } from './core/channels/platforms/douyin/douyin.config'
import { facebookConfigSchema } from './core/channels/platforms/facebook/facebook.config'
import { googleBusinessConfigSchema } from './core/channels/platforms/google-business/google-business.config'
import { instagramConfigSchema } from './core/channels/platforms/instagram/instagram.config'
import { kwaiConfigSchema } from './core/channels/platforms/kwai/kwai.config'
import { linkedinConfigSchema } from './core/channels/platforms/linkedin/linkedin.config'
import { pinterestConfigSchema } from './core/channels/platforms/pinterest/pinterest.config'
import { rednoteConfigSchema } from './core/channels/platforms/rednote/rednote.config'
import { threadsConfigSchema } from './core/channels/platforms/threads/threads.config'
import { tiktokConfigSchema } from './core/channels/platforms/tiktok/tiktok.config'
import { twitterConfigSchema } from './core/channels/platforms/twitter/twitter.config'
import { wechatConfigSchema } from './core/channels/platforms/wechat/wechat.config'
import { youtubeConfigSchema } from './core/channels/platforms/youtube/youtube.config'

const httpUrlSchema = z.url({ protocol: /^https?$/ })

export const relayConfigSchema = z.object({
  serverUrl: httpUrlSchema.describe('中转服务器地址'),
  apiKey: z.string().describe('用户 API Key'),
  callbackUrl: httpUrlSchema.describe('OAuth 回调完整地址，如 http://localhost:3000/api/v2/channels/relay/callback'),
})

export const apiKeyConfigSchema = z.object({
  prefix: z.string().min(1).default('ai_'),
}).default({ prefix: 'ai_' })

export const channelConfigSchema = z.object({
  channelDb: channelDbConfigSchema,
  shortLink: z.object({
    baseUrl: z.string().default(''),
  }),
  bilibili: bilibiliConfigSchema.optional(),
  douyin: douyinConfigSchema.optional(),
  facebook: facebookConfigSchema.optional(),
  kwai: kwaiConfigSchema.optional(),
  instagram: instagramConfigSchema.optional(),
  linkedin: linkedinConfigSchema.optional(),
  googleBusiness: googleBusinessConfigSchema.optional(),
  pinterest: pinterestConfigSchema.optional(),
  rednote: rednoteConfigSchema.optional(),
  threads: threadsConfigSchema.optional(),
  tiktok: tiktokConfigSchema.optional(),
  twitter: twitterConfigSchema.optional(),
  wechat: wechatConfigSchema.optional(),
  youtube: youtubeConfigSchema.optional(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  environment: z.enum(['development', 'production']).default('development'),
  auth: aitoearnAuthConfigSchema,
  apiKey: apiKeyConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  assets: assetsConfigSchema,
  aiClient: aitoearnAiClientConfigSchema,
  channel: channelConfigSchema,
  relay: relayConfigSchema.optional(),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
