import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const tmsConfigSchema = z.object({
  secretId: z.string().default(''),
  secretKey: z.string().default(''),
  region: z.string().default('ap-beijing'),
})

export class TmsConfig extends createZodDto(tmsConfigSchema) {}
