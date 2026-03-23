import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const s3ConfigSchema = z.object({
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  bucketName: z.string(),
  endpoint: z.url(),
  cdnEndpoint: z.url().optional(),
  signExpires: z.number().default(5 * 60).describe('sign expires in seconds'),
  forcePathStyle: z.boolean().default(false).describe('使用 path-style 访问，本地 S3 兼容服务需要开启'),
  publicEndpoint: z.url().optional().describe('客户端可访问的公网 endpoint，用于生成 presigned URL；不设置时使用 endpoint'),
})

export class S3Config extends createZodDto(s3ConfigSchema) {}
