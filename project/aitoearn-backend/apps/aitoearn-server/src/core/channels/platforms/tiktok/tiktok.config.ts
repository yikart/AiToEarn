import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const tiktokAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  scopes: z.array(z.string()).default([]),
  pullFromUrlAllowedPrefixes: z.array(z.string()).default([]),
})

export const tiktokConfigSchema = createPlatformConfigSchema(tiktokAvailableConfigSchema)

export class TiktokConfig extends createZodDto(tiktokAvailableConfigSchema) {}
