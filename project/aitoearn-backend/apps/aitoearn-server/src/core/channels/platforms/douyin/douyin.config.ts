import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { AuthType, PlatformStatus } from '../platforms.interface'

const douyinMiniAppConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  sandbox: z.boolean().default(false),
})

export interface DouyinMiniAppConfigValue {
  clientId: string
  clientSecret: string
  sandbox: boolean
}

export interface DouyinConfigValue {
  status: PlatformStatus.Available
  clientId: string
  clientSecret: string
  redirectUri: string
  logoUrl: string
  authType: AuthType.OAuth2 | AuthType.QrCode
  scopes: string[]
  miniApp?: DouyinMiniAppConfigValue
}

const douyinBaseConfigSchema = {
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  scopes: z.array(z.string()).default([]),
}

const douyinAvailableConfigSchema = z.discriminatedUnion('authType', [
  z.object({
    ...douyinBaseConfigSchema,
    authType: z.literal(AuthType.OAuth2),
    miniApp: douyinMiniAppConfigSchema.optional(),
  }),
  z.object({
    ...douyinBaseConfigSchema,
    authType: z.literal(AuthType.QrCode),
    miniApp: douyinMiniAppConfigSchema,
  }),
])

export const douyinConfigSchema = createPlatformConfigSchema(douyinAvailableConfigSchema)

export type DouyinConfigInput = z.input<typeof douyinAvailableConfigSchema>

export class DouyinConfig extends createZodDto<DouyinConfigValue, DouyinConfigInput>(douyinAvailableConfigSchema) {}
