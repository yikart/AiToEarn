import { AccountType, createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const createMcpApiKeySchema = z.object({
  desc: z.string().optional().describe('描述'),
  accounts: z.array(z.string()).describe('关联账户'),
})
export class CreateMcpApiKeyDto extends createZodDto(createMcpApiKeySchema) {}

export const deleteApiKeyAccountSchema = z.object({
  key: z.string().describe('API Key'),
  accountId: z.string().describe('账号ID'),
})
export class DeleteApiKeyAccountDto extends createZodDto(deleteApiKeyAccountSchema) {}

export const UpdateMcpApiKeyDescSchema = z.object({
  key: z.string().describe('API Key'),
  desc: z.string().describe('描述'),
})
export class UpdateMcpApiKeyDescDto extends createZodDto(UpdateMcpApiKeyDescSchema) {}

export const mcpListApiKeysQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  ...PaginationDtoSchema.shape,
})

export class McpListApiKeysQueryDto extends createZodDto(mcpListApiKeysQuerySchema) {}

export const mcpListApiKeyAccountsQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
})

export class McpListApiKeyAccountsQueryDto extends createZodDto(mcpListApiKeyAccountsQuerySchema) {}

export const createApiKeyAccountSchema = z.object({
  apiKey: z.string().describe('API Key'),
  accountId: z.string().describe('账号ID'),
  accountType: z.enum(AccountType).describe('账号类型'),
})

export class CreateApiKeyAccountDto extends createZodDto(createApiKeyAccountSchema) {}
