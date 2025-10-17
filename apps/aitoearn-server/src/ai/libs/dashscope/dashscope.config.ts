import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const dashscopeConfigSchema = z.object({
  apiKey: z.string().describe('DashScope API Key'),
  baseUrl: z.string().default('https://dashscope.aliyuncs.com').describe('DashScope Base URL'),
})

export class DashscopeConfig extends createZodDto(dashscopeConfigSchema) {}
