import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const rednoteAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  logoUrl: z.url(),
  appKey: z.string().min(1),
  appSecret: z.string().min(1),
  accessTokenUrl: z.url(),
})

export const rednoteConfigSchema = createPlatformConfigSchema(rednoteAvailableConfigSchema)

export class RednoteConfig extends createZodDto(rednoteAvailableConfigSchema) {}
