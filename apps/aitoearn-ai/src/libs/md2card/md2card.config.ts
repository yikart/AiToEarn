import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const md2cardConfigSchema = z.object({
  apiKey: z.string().describe('MD2Card API Key'),
  apiUrl: z.string().default('https://md2card.cn').describe('MD2Card API URL'),
  timeout: z.number().default(60000).describe('API请求超时时间(毫秒)'),
})

export class Md2cardConfig extends createZodDto(md2cardConfigSchema) {}
