import { createZodDto, TableDtoSchema } from '@yikart/common'
import { TaskPunishType } from '@yikart/task-db'
import { z } from 'zod'

export const createTaskPunishSchema = z.object({
  userTaskId: z.string(),
  userId: z.string(),
  type: z.enum(TaskPunishType),
  title: z.string(),
  amount: z.number().optional(),
  description: z.string(),
  metadata: z.object().optional(),
})
export class CreateTaskPunishDto extends createZodDto(createTaskPunishSchema) {}

export const updateTaskPunishSchema = z.object({
  ...createTaskPunishSchema.partial().shape,
  id: z.string(),
})
export class UpdateTaskPunishDto extends createZodDto(updateTaskPunishSchema) {}

export const queryTaskPunishFilterSchema = z.object({
  taskId: z.string().optional(),
  userId: z.string().optional(),
})
export class QueryTaskPunishFilterDto extends createZodDto(queryTaskPunishFilterSchema) {}

export const queryTaskPunishSchema = z.object({
  page: TableDtoSchema,
  filter: queryTaskPunishFilterSchema,
})
export class QueryTaskPunishDto extends createZodDto(queryTaskPunishSchema) {}
