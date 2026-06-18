import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const relayConfigSchema = z.object({
  url: z.string().describe('AI Relay 服务端 Base URL（不含 /api 前缀，服务端会自动拼接 /api/ai/... 路径），用于视频中继 channel 出站调用'),
  apiKey: z.string().describe('AI Relay API Key，通过 x-api-key header 鉴权'),
  timeout: z.number().default(300 * 1000).describe('请求超时时间（毫秒）'),
})

export class RelayConfig extends createZodDto(relayConfigSchema) {}
