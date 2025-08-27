import { createZodDto, natsConfig } from '@yikart/common'
import z from 'zod'

export const natsConfigSchema = z.object({
  ...natsConfig.shape,
})

export class NatsConfig extends createZodDto(natsConfigSchema) {}
