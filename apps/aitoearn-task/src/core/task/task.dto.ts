import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { tableSchema } from './admin/task-admin.dto'

export const taskIdSchema = z.object({
  id: z.string().min(1),
})

export class TaskIdDto extends createZodDto(taskIdSchema) {}

export const userIdSchema = z.object({
  userId: z.string().min(1),
})

export class UserIdDto extends createZodDto(userIdSchema) {}

export const opportunityIdSchema = z.object({
  opportunityId: z.string().min(1),
})
export class OpportunityIdDto extends createZodDto(opportunityIdSchema) {}

export const acceptTaskSchema = z.object({
  opportunityId: z.string().min(1),
  userId: z.string().min(1),
})
export class AcceptTaskDto extends createZodDto(acceptTaskSchema) {}

export const taskOpportunityListSchema = z.object({
  userId: z.string().min(1).optional(),
})
export const adminTaskListSchema = z.object({
  page: tableSchema,
  filter: taskOpportunityListSchema,
})
export class TaskOpportunityListDto extends createZodDto(adminTaskListSchema) {}
