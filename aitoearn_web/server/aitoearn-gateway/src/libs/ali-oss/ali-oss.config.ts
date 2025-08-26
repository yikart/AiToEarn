import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const aliOssConfigSchema = z.object({
  accessKeyId: z.string().default(''),
  accessKeySecret: z.string().default(''),
  bucket: z.string().default(''),
  region: z.string().default(''),
  endpoint: z.string().optional(),
  internal: z.boolean().default(false),
  secure: z.boolean().default(true),
  timeout: z.union([z.string(), z.number()]).default(60000),
  cname: z.boolean().default(false),
  isRequestPay: z.boolean().default(false),
  hostUrl: z.string().default(''),
})

export class AliOssConfig extends createZodDto(aliOssConfigSchema) {}
