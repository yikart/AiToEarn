import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const ApiKeyCreatedVoSchema = z.object({
  id: z.string().describe('API Key ID'),
  name: z.string().describe('名称'),
  key: z.string().describe('API Key 明文（仅创建时返回一次）'),
  createdAt: z.date().describe('创建时间'),
})
export class ApiKeyCreatedVo extends createZodDto(ApiKeyCreatedVoSchema, 'ApiKeyCreatedVo') {}

const ApiKeyItemVoSchema = z.object({
  id: z.string().describe('API Key ID'),
  name: z.string().describe('名称'),
  lastUsedAt: z.date().nullable().describe('最后使用时间'),
  createdAt: z.date().describe('创建时间'),
})
export class ApiKeyItemVo extends createZodDto(ApiKeyItemVoSchema, 'ApiKeyItemVo') {}
