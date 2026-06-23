import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { createPlatformConfigSchema } from '../platforms.config'
import { PlatformStatus } from '../platforms.interface'

const linkedinAvailableConfigSchema = z.object({
  status: z.literal(PlatformStatus.Available),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  logoUrl: z.url(),
  restVersion: z.string().default('202605'),
  webhookSecret: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

export const linkedinConfigSchema = createPlatformConfigSchema(linkedinAvailableConfigSchema)

export class LinkedinConfig extends createZodDto(linkedinAvailableConfigSchema) {}
