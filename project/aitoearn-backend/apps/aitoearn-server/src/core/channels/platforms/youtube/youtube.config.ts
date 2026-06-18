import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const youtubeAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  webhookVerifyToken: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

export const youtubeConfigSchema = createPlatformConfigSchema(youtubeAvailableConfigSchema)

export class YoutubeConfig extends createZodDto(youtubeAvailableConfigSchema) {}
