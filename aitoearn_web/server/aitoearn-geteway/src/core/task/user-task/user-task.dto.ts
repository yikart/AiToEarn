import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const getUserTaskListSchema = z.object({
  userId: z.string().min(1),
  status: z.string().optional(),
})

export class GetUserTaskListDto extends createZodDto(getUserTaskListSchema) {}
