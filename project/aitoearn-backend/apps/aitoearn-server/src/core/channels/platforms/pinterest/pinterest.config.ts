import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const pinterestAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  baseUrl: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

export const pinterestConfigSchema = createPlatformConfigSchema(pinterestAvailableConfigSchema)

export class PinterestConfig extends createZodDto(pinterestAvailableConfigSchema) {}
