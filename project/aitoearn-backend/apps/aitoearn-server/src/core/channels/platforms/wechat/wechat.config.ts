import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const wechatOfficialAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  appId: z.string(),
  appSecret: z.string(),
  hostUrl: z.string().default(''),
  token: z.string().default(''),
  encodingAESKey: z.string().default(''),
  redirectUri: z.string().default(''),
  logoUrl: z.url(),
  scopes: z.array(z.string()).default([]),
})

const wechatChannelsAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  appId: z.string(),
  appSecret: z.string(),
  token: z.string().default(''),
  encodingAESKey: z.string().default(''),
  redirectUri: z.string().default(''),
  logoUrl: z.url(),
})

export const wechatOfficialConfigSchema = createPlatformConfigSchema(wechatOfficialAvailableConfigSchema)
export const wechatChannelsConfigSchema = createPlatformConfigSchema(wechatChannelsAvailableConfigSchema)

export const wechatConfigSchema = z.object({
  official: wechatOfficialConfigSchema.default({ status: PlatformStatus.Hidden, logoUrl: '' } as never),
  channels: wechatChannelsConfigSchema.default({ status: PlatformStatus.Hidden, logoUrl: '' } as never),
})

export class WechatOfficialConfig extends createZodDto(wechatOfficialAvailableConfigSchema) {}
export class WechatChannelsConfig extends createZodDto(wechatChannelsAvailableConfigSchema) {}
export class WechatConfig extends createZodDto(wechatConfigSchema) {}
