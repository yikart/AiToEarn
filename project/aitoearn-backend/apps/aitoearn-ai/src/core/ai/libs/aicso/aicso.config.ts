import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const aicsoConfigSchema = z.object({
  apiKey: z.string().describe('Aicso API Key'),
  baseUrl: z.string().default('https://api.aicso.top').describe('Aicso API Base URL'),
})

export class AicsoConfig extends createZodDto(aicsoConfigSchema) {}
