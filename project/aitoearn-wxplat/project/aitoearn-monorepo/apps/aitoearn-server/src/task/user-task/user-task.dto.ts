import { z } from 'zod/v4'
import { UserTaskStatus } from './common'

export const userTaskQueryFilterSchema = z.object({
  status: z.enum(['doing', 'pending', 'approved', 'rejected', 'cancelled', 'del'] as const).optional(),
})

export interface UserTaskQueryFilterDto {
  status?: UserTaskStatus
}
