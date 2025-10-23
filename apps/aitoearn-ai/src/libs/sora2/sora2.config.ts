import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const sora2ConfigSchema = z.object({
  apiKey: z.string().describe('Sora2 API Key'),
  baseUrl: z.string().default('https://api.aicso.top').describe('Sora2 Base URL'),
})

export class Sora2Config extends createZodDto(sora2ConfigSchema) {}
