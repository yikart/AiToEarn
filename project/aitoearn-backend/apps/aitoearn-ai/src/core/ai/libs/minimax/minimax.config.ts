import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const minimaxConfigSchema = z.object({
  apiKey: z.string().describe('MiniMax API Key'),
  baseUrl: z.string().default('https://api.minimax.io').describe('MiniMax API Base URL'),
  timeout: z.number().default(60000).describe('MiniMax API timeout in milliseconds'),
})

export class MiniMaxConfig extends createZodDto(minimaxConfigSchema) {}
