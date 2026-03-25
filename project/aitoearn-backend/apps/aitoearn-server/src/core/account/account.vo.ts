import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const BatchAccountStatusVoSchema = z.object({
  statuses: z.record(z.string(), z.number()).describe('账号 ID → 状态映射'),
})
export class BatchAccountStatusVo extends createZodDto(BatchAccountStatusVoSchema, 'BatchAccountStatusVo') {}
