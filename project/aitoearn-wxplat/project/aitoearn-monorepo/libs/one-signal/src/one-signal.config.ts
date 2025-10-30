import { createZodDto } from '@yikart/common'
import z from 'zod'

export const oneSignalConfigSchema = z.object({
  organizationApiKey: z.string().optional(),
  restApiKey: z.string(),
  appId: z.string(),
})

export class OneSignalConfig extends createZodDto(oneSignalConfigSchema) {}
