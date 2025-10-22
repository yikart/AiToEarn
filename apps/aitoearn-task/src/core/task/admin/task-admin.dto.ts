import { createZodDto } from '@yikart/common'
import { AccountType, TaskStatus, TaskType } from '@yikart/task-db'
import { z } from 'zod'

export const tableSchema = z.object({
  pageNo: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

export const taskIdSchema = z.object({
  id: z.string().min(1),
})

export const interactionTaskDataSchema = z.object({
  type: z.literal('interaction'),
  targetWorksId: z.string().min(1),
  targetAuthorId: z.string().optional(),
  platform: z.string().optional(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(TaskType),
  maxRecruits: z.number().int().min(1),
  deadline: z.iso.datetime(),
  reward: z.number().min(0),
  accountTypes: z.array(z.enum(AccountType)).min(1),
  materialGroupId: z.string().min(1),
  taskData: interactionTaskDataSchema.optional(),
  autoDeleteMaterial: z.boolean(),
  autoDispatch: z.boolean().optional(),
})
export class CreateTaskDto extends createZodDto(createTaskSchema) {}

export const updateTaskSchema = z.object({
  ...createTaskSchema.shape,
  id: z.string().min(1),
})
export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}

export const upTaskStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(TaskStatus),
})
export class UpTaskStatusDto extends createZodDto(upTaskStatusSchema) {}

export const adminTaskListFilterSchema = z.object({
  type: z.enum(TaskType).optional(),
  status: z.enum(TaskStatus).optional(),
  keyword: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const adminTaskListSchema = z.object({
  page: tableSchema,
  filter: adminTaskListFilterSchema,
})
export class AdminTaskListDto extends createZodDto(adminTaskListSchema) {}

export class TaskIdDto extends createZodDto(taskIdSchema) {}
export class AdminTaskListFilterDto extends createZodDto(adminTaskListFilterSchema) {}
export class InteractionTaskDataDto extends createZodDto(interactionTaskDataSchema) {}

export const publishTaskToAccountListSchema = z.object({
  taskId: z.string(),
  accountIds: z.array(z.string()).min(1),
})
export class PublishTaskToAccountListDto extends createZodDto(publishTaskToAccountListSchema) {}

export const publishTaskToUserListSchema = z.object({
  taskId: z.string(),
  userIds: z.array(z.string()).min(1),
})
export class PublishTaskToUserListDto extends createZodDto(publishTaskToUserListSchema) {}

export const pushTaskWithUserCreateSchema = z.object({
  userId: z.string().min(1),
})
export class PushTaskWithUserCreateDto extends createZodDto(pushTaskWithUserCreateSchema) {}

export const updateAutoDeleteMaterialSchema = z.object({
  id: z.string().min(1),
  data: z.boolean(),
})
export class UpdateAutoDeleteMaterialDto extends createZodDto(updateAutoDeleteMaterialSchema) {}
