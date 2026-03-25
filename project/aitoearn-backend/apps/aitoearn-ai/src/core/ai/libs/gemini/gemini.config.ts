import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const geminiKeyManagerConfigSchema = z.object({
  cooldownSeconds: z.number().default(300).describe('Key 冷却时间（秒）'),
  failureThreshold: z.number().default(3).describe('失败阈值'),
  redisKeyPrefix: z.string().default('gemini:vertex').describe('Redis Key 前缀'),
})

export const geminiKeyPairSchema = z.object({
  projectId: z.string().describe('Google Cloud Project ID (also used as Key Pair ID)'),
  apiKey: z.string().describe('Vertex AI API Key'),
  keyFile: z.string().describe('GCS 服务账号 JSON 文件路径'),
  bucket: z.string().describe('GCS Bucket 名称'),
})

export type GeminiKeyPair = z.infer<typeof geminiKeyPairSchema>

export const geminiConfigSchema = z.object({
  // Key Pairs 配置（必填）
  keyPairs: z.array(geminiKeyPairSchema).describe('Gemini Key Pairs'),
  location: z.string().default('us-central1'),

  // 图片生成 API 配置（单 Key）
  apiKey: z.string().describe('Gemini Image Generation API Key'),
  baseUrl: z.string().describe('Gemini Image Generation Base URL'),

  // Key 管理配置
  keyManager: geminiKeyManagerConfigSchema.optional(),

  // 反向代理配置（国内部署时使用）
  proxyUrl: z.string().optional().describe('通用反向代理地址（如 https://proxy.domain.com）'),
})

export class GeminiConfig extends createZodDto(geminiConfigSchema) { }

export class GeminiKeyManagerConfig extends createZodDto(geminiKeyManagerConfigSchema) { }
