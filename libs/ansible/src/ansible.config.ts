import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ansibleConfigSchema = z.object({
  timeout: z.int().positive().optional().default(300),
  forks: z.int().positive().optional().default(5),
  verbosity: z.int().min(0).max(4).optional().default(0),
})

export class AnsibleConfig extends createZodDto(ansibleConfigSchema) {}
