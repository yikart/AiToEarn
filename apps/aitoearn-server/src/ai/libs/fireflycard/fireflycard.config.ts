import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const fireflycardConfigSchema = z.object({
  apiUrl: z.string().describe('Fireflycard API URL'),
})

export class FireflycardConfig extends createZodDto(fireflycardConfigSchema) {}
