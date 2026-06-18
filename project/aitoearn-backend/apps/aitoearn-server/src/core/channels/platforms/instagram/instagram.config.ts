import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const instagramAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  graphApiVersion: z.string().default('v25.0'),
  redirectUri: z.string(),
  logoUrl: z.url(),
  webhookVerifyToken: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

export const instagramConfigSchema = createPlatformConfigSchema(instagramAvailableConfigSchema)

export class InstagramConfig extends createZodDto(instagramAvailableConfigSchema) {}
