import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const mcpConfigSchema = z.object({
  url: z.string().default(''),
  isGlobal: z.boolean().default(false),
  // StreamableHTTPClientTransportOptions 相关配置
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
})

export class McpConfig extends createZodDto(mcpConfigSchema) {}
