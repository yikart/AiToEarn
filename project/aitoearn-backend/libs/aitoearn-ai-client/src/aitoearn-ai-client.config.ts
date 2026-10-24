import { createZodDto } from '@yikart/common'
import z from 'zod'

export const aitoearnAiClientConfigSchema = z.object({
  baseUrl: z.string(),
  token: z.string().min(32).regex(/^\S+$/),
})

export class AitoearnAiClientConfig extends createZodDto(aitoearnAiClientConfigSchema) {}
