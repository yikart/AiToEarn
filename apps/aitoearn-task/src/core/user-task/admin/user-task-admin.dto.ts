import { createZodDto } from '@yikart/common'
import { TaskStatus } from '@yikart/task-db'
import { z } from 'zod'

export const tableSchema = z.object({
  pageNo: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const userIdSchema = z.object({
  userId: z.string().min(1),
})

export const userTaskIdSchema = z.object({
  id: z.string().min(1),
})

export const userTaskUserIdSchema = userTaskIdSchema.merge(z.object({
  userId: z.string().min(1),
}))

export const userTaskFilterSchema = z.object({
  status: z.enum(TaskStatus).optional(),
  keyword: z.string().optional(),
  time: z.array(z.string()).length(2).optional(),
})

export const adminQueryUserTaskSchema = z.object({
  filter: userTaskFilterSchema,
  page: tableSchema,
})

export const rejectedTaskSchema = z.object({
  id: z.string().min(1),
  managerId: z.string().min(1),
  reason: z.string().optional(),
  verificationNote: z.string().optional(),
})

export const distributeTaskSchema = z.object({
  taskId: z.string().min(1),
  targetUserIds: z.array(z.string().min(1)).min(1),
})

export class UserIdDto extends createZodDto(userIdSchema) {}
export class UserTaskIdDto extends createZodDto(userTaskIdSchema) {}
export class UserTaskUserIdDto extends createZodDto(userTaskUserIdSchema) {}
export class UserTaskFilterDto extends createZodDto(userTaskFilterSchema) {}
export class AdminQueryUserTaskDto extends createZodDto(adminQueryUserTaskSchema) {}
export class RejectedTaskDto extends createZodDto(rejectedTaskSchema) {}
export class DistributeTaskDto extends createZodDto(distributeTaskSchema) {}
