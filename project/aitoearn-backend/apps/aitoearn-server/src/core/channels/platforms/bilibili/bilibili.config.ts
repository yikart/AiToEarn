import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const bilibiliAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
})

export const bilibiliConfigSchema = createPlatformConfigSchema(bilibiliAvailableConfigSchema)

export class BilibiliConfig extends createZodDto(bilibiliAvailableConfigSchema) {}
