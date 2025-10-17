import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const klingConfigSchema = z.object({
  baseUrl: z.string().default('https://api-beijing.klingai.com').describe('Kling Base URL'),
  accessKey: z.string().describe('Kling Access Key'),
  secretKey: z.string().optional().describe('Kling Secret Key'),
})

export class KlingConfig extends createZodDto(klingConfigSchema) {}
