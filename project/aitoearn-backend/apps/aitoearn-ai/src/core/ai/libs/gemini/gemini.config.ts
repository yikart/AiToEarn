import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const geminiConfigSchema = z.object({
  apiKey: z.string().describe('Gemini Image Generation API Key'),
  baseUrl: z.string().describe('Gemini Image Generation Base URL'),

  // 反向代理配置（国内部署时使用）
  proxyUrl: z.string().optional().describe('通用反向代理地址（如 https://proxy.domain.com）'),
})

export class GeminiConfig extends createZodDto(geminiConfigSchema) { }
