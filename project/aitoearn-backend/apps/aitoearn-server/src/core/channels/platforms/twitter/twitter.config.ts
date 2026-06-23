import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const twitterAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  scopes: z.array(z.string()).default([]),
})

export const twitterConfigSchema = createPlatformConfigSchema(twitterAvailableConfigSchema)

export class TwitterConfig extends createZodDto(twitterAvailableConfigSchema) {}
