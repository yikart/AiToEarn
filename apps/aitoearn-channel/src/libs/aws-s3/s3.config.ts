import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const s3ConfigSchema = z.object({
  region: z.string().default(''),
  accessKeyId: z.string().default(''),
  secretAccessKey: z.string().default(''),
  bucketName: z.string().default(''),
  hostUrl: z.string().default(''),
})

export class S3Config extends createZodDto(s3ConfigSchema) {}
