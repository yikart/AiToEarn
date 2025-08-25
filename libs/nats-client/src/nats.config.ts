import { createZodDto } from '@yikart/common'
import z from 'zod'

export const natsConfigSchema = z.object({
  name: z.string().optional(),
  servers: z.array(z.string()),
  user: z.string().optional(),
  pass: z.string().optional(),
  prefix: z.string().optional(),
})

export class NatsConfig extends createZodDto(natsConfigSchema) {}
