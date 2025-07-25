import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const natsConfigSchema = z.object({
  name: z.string().default(''),
  servers: z.array(z.string()).default(['nats://127.0.0.1:4222']),
  user: z.string().default(''),
  pass: z.string().default(''),
  prefix: z.string().default(''),
})

export class NatsConfig extends createZodDto(natsConfigSchema) {}
