import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ucloudConfigSchema = z.object({
  publicKey: z.string(),
  privateKey: z.string(),
  projectId: z.string(),
  region: z.string().optional(),
  baseUrl: z.string().optional(),
  timeout: z.number().optional(),
})

export class UCloudConfig extends createZodDto(ucloudConfigSchema) {}
