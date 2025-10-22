import { createZodDto, TableDtoSchema } from '@yikart/common'
import { UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

export const userTaskQueryFilterSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(UserTaskStatus).optional(),
})
export const userTaskQuerySchema = z.object({
  filter: userTaskQueryFilterSchema,
  page: TableDtoSchema,
})
export class UserTaskQueryDto extends createZodDto(userTaskQuerySchema) {}

export const userTaskSubmitSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  materialId: z.string().optional(),
})
export class UserTaskSubmitDto extends createZodDto(userTaskSubmitSchema) {}

export const userTaskWithdrawSchema = z.object({
  id: z.string().min(1),
  flowId: z.string().optional(),
})
export class UserTaskWithdrawDto extends createZodDto(userTaskWithdrawSchema) {}

export const userTaskIdSchema = z.object({
  userId: z.string(),
  id: z.string().min(1),
})
export class UserTaskIdDto extends createZodDto(userTaskIdSchema) {}

export const userTaskDetailSchema = z.object({
  userId: z.string(),
  id: z.string().min(1),
})
export class UserTaskDetailDto extends createZodDto(userTaskDetailSchema) {}

export const UserTaskAcceptSchema = z.object({
  userId: z.string(),
  opportunityId: z.string().min(1),
  accountId: z.string().optional(),
})
export class UserTaskAcceptDto extends createZodDto(UserTaskAcceptSchema) {}
