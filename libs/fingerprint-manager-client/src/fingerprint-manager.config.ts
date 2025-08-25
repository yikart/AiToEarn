import { createZodDto } from '@yikart/common'
import z from 'zod'

// Fingerprint Manager 客户端配置
export const fingerprintManagerConfigSchema = z.object({
  name: z.string().optional(),
  servers: z.array(z.string()),
  user: z.string().optional(),
  pass: z.string().optional(),
  prefix: z.string().optional().default('fingerprint-manager'),
  timeout: z.number().optional().default(5000),
})

export class FingerprintManagerConfig extends createZodDto(fingerprintManagerConfigSchema) {}
