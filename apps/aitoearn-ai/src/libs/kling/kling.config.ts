import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const klingConfigSchema = z.object({
  apiKey: z.string().describe('Kling API Key'),
  secretKey: z.string().describe('Kling Secret Key'),
})

export class KlingConfig extends createZodDto(klingConfigSchema) {}
