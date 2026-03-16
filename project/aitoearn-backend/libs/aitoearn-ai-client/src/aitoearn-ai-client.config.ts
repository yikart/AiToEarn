import { createZodDto } from '@yikart/common'
import z from 'zod'

export const aitoearnAiClientConfigSchema = z.object({
  baseUrl: z.string(),
  token: z.string(),
})

export class AitoearnAiClientConfig extends createZodDto(aitoearnAiClientConfigSchema) {}
