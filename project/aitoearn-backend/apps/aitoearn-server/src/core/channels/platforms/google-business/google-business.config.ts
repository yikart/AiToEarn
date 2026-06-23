import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const googleBusinessAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  scopes: z.array(z.string()).default([]),
})

export const googleBusinessConfigSchema = createPlatformConfigSchema(googleBusinessAvailableConfigSchema)

export class GoogleBusinessConfig extends createZodDto(googleBusinessAvailableConfigSchema) {}
