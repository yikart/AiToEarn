import { createZodDto } from '@yikart/common'
import { UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

const userTaskListQuerySchema = z.object({
  status: z.enum(UserTaskStatus).optional(),
  keyword: z.string().optional(),
  userId: z.string().optional(),
  opportunityId: z.string().optional(),
  taskId: z.string().optional(),
  time: z.array(z.string()).length(2).optional(),
})
export class UserTaskListQueryDto extends createZodDto(userTaskListQuerySchema) {}

const userTaskApprovedSchema = z.object({
  id: z.string(),
  screenshotUrls: z.array(z.string()).optional(),
})
export class UserTaskApprovedDto extends createZodDto(userTaskApprovedSchema) {}

export const rejectedTaskSchema = z.object({
  id: z.string().min(1),
  rejectionReason: z.string().optional(),
  verificationNote: z.string().optional(),
})
export class RejectedTaskDto extends createZodDto(rejectedTaskSchema) {}
