import { createPaginationVo, createZodDto } from '@yikart/common'
import { APIKeyStatus, APIKeyType } from '@yikart/mongodb'
import { z } from 'zod/v3'

const mcpApiKeyItemSchema = z.object({
  id: z.string().describe('API Key ID'),
  userId: z.string().describe('用户ID'),
  desc: z.string().optional().describe('描述'),
  status: z.enum(APIKeyStatus).describe('状态'),
  type: z.enum(APIKeyType).describe('类型'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class McpApiKeyItemVo extends createZodDto(mcpApiKeyItemSchema) {}

export class McpApiKeysListResponseVo extends createPaginationVo(mcpApiKeyItemSchema, 'McpApiKeysListResponseVo') {}

const mcpApiKeyDetailResponseSchema = z.object({
  ...mcpApiKeyItemSchema.shape,
})

export class McpApiKeyDetailResponseVo extends createZodDto(mcpApiKeyDetailResponseSchema) {}
