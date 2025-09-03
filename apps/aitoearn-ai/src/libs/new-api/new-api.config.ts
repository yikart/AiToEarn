import { createZodDto } from '@yikart/common'
import { z } from 'zod'

/**
 * New API 配置 Schema
 */
export const newApiConfigSchema = z.object({
  apiKey: z.string().describe('New API Key'),
  baseURL: z.string().describe('New API Base URL'),
  internalToken: z.string(),
  userId: z.number().describe('使用的用户ID，需要管理员权限'),
  timeout: z.number().default(30000),
})

/**
 * New API 配置类
 */
export class NewApiConfig extends createZodDto(newApiConfigSchema) {}
