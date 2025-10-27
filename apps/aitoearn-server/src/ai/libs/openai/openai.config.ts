import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const openaiConfigSchema = z.object({
  apiKey: z.string().describe('OpenAI API Key'),
  baseUrl: z.string().default('https://api.openai.com/v1').describe('OpenAI Base URL'),
  timeout: z.number().default(300 * 1000),
})

export class OpenaiConfig extends createZodDto(openaiConfigSchema) {}
