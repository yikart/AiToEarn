import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const statisticsDbConfigSchema = z.object({
  uri: z.string(),
  dbName: z.string().optional(),
  autoIndex: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
})

export class StatisticsDbConfig extends createZodDto(statisticsDbConfigSchema) {}
