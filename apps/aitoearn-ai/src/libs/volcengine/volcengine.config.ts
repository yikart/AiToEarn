import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const volcengineConfigSchema = z.object({
  apiKey: z.string().describe('Volcengine API Key'),
  baseURL: z.string().default('https://ark.cn-beijing.volces.com').describe('Volcengine Base URL'),
})

export class VolcengineConfig extends createZodDto(volcengineConfigSchema) {}
