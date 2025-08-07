import { createZodDto } from '@aitoearn/common'
import { z } from 'zod'

const mongodbConfigSchema = z.object({
  uri: z.string(),
  dbName: z.string().optional(),
  autoIndex: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
})
export class MongodbConfig extends createZodDto(mongodbConfigSchema) {}
