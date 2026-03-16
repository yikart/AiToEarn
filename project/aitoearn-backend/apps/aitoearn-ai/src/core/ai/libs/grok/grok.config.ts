import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const grokConfigSchema = z.object({
  apiKey: z.string().describe('Grok API Key'),
  baseUrl: z.string().default('https://api.x.ai').describe('Grok API Base URL'),
  proxyUrl: z.string().optional().describe('反向代理地址'),
})

export class GrokConfig extends createZodDto(grokConfigSchema) {}
