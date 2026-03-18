import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const s3ConfigSchema = z.object({
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucketName: z.string(),
  endpoint: z.url(),
  cdnEndpoint: z.url().optional(),
  signEndpoint: z.url().optional().describe('预签名 URL 使用的外部可达 endpoint，不设置则使用 endpoint'),
  signExpires: z.number().default(5 * 60).describe('sign expires in seconds'),
})

export class S3Config extends createZodDto(s3ConfigSchema) {}
