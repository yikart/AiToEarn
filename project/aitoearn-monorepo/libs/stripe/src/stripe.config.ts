import { createZodDto } from '@yikart/common'
import z from 'zod'

export const stripeConfigSchema = z.object({
  ak: z.string().default(''),
  sk: z.string().default(''),
  endpointSecret: z.string().default(''),
  trial_period_days: z.number().default(0),
})

export class StripeConfig extends createZodDto(stripeConfigSchema) {}
