import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const s3ConfigSchema = z.object({
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucketName: z.string(),
  hostUrl: z.string().default(''),
  signExpires: z.number().default(5 * 60).describe('sign expires in seconds'),
})

export class S3Config extends createZodDto(s3ConfigSchema) {}
