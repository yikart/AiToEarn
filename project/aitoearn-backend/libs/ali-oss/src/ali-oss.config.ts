import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const aliOssConfigSchema = z.object({
  accessKeyId: z.string().describe('阿里云 AccessKey ID'),
  accessKeySecret: z.string().describe('阿里云 AccessKey Secret'),
  bucket: z.string().describe('OSS Bucket 名称'),
  region: z.string().describe('OSS 区域，如 oss-cn-hangzhou'),
  endpoint: z.url().optional().describe('自定义 endpoint'),
  cdnEndpoint: z.url().optional().describe('CDN 加速域名'),
  internal: z.boolean().optional().describe('是否使用内网访问'),
  secure: z.boolean().optional().describe('是否使用 HTTPS'),
  timeout: z.union([z.string(), z.number()]).optional().describe('请求超时时间'),
  cname: z.boolean().optional().describe('是否使用自定义域名'),
  signExpires: z.number().default(5 * 60).describe('签名 URL 过期时间（秒）'),
})

export class AliOssConfig extends createZodDto(aliOssConfigSchema, 'AliOssConfig') {}
