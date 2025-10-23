import { createZodDto } from '@yikart/common'
import { AccountType, TaskType } from '@yikart/task-db'
import { z } from 'zod'

export const interactionTaskDataSchema = z.object({
  type: z.literal('interaction'),
  targetWorksId: z.string().min(1),
  targetAuthorId: z.string().optional(),
  platform: z.string().optional(),
})

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(TaskType),
  maxRecruits: z.number().int().min(1),
  deadline: z.iso.datetime(),
  reward: z.number().min(0),
  accountTypes: z.array(z.enum(AccountType)).min(1),
  taskData: interactionTaskDataSchema.optional(),
  // materialIds: z.array(z.string()).optional(),
  materialGroupId: z.string().min(1),
  autoDeleteMaterial: z.boolean(),
  autoDispatch: z.boolean().optional(),
})
export class CreateTaskDto extends createZodDto(createTaskSchema) {}

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(TaskType).optional(),
  reward: z.number().min(0).optional(),
  maxRecruits: z.number().min(1).optional(),
  deadline: z.iso.datetime().optional(),
  accountTypes: z.array(z.string()).optional(),
  materialGroupId: z.string().min(1),
  // materialIds: z.array(z.string()).optional(),
  autoDeleteMaterial: z.boolean(),
  autoDispatch: z.boolean().optional(),
})
export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}

const taskListQuerySchema = z.object({
  status: z.string().optional(),
  keyword: z.string().optional(),
})
export class TaskListQueryDto extends createZodDto(taskListQuerySchema) {}

const updateTaskStatusSchema = z.object({
  status: z.string(),
})
export class UpdateTaskStatusDto extends createZodDto(updateTaskStatusSchema) {}

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

const getOpportunityListQuerySchema = z.object({
  userId: z.string().optional(),
  taskId: z.string(),
})
export class GetOpportunityListQueryDto extends createZodDto(getOpportunityListQuerySchema) {}

const updateAutoDeleteMaterialSchema = z.object({
  data: z.boolean(),
})
export class UpdateAutoDeleteMaterialDto extends createZodDto(updateAutoDeleteMaterialSchema) {}
