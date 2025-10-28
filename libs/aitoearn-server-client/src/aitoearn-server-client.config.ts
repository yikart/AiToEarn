import { createZodDto } from '@yikart/common'
import z from 'zod'

export const oneSignalConfigSchema = z.object({
  baseUrl: z.string(),
})

export class AitoearnServerClientConfig extends createZodDto(oneSignalConfigSchema) {}
