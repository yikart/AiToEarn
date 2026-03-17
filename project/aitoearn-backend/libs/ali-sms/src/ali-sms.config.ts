import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const aliSmsConfigSchema = z.object({
  accessKeyId: z.string().describe('阿里云 AccessKey ID'),
  accessKeySecret: z.string().describe('阿里云 AccessKey Secret'),
  signName: z.string().describe('短信签名'),
  templateCode: z.string().describe('短信模板编号'),
})

export class AliSmsConfig extends createZodDto(aliSmsConfigSchema, 'AliSmsConfig') {}
