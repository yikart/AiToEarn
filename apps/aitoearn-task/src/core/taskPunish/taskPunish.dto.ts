import { createZodDto, TableDtoSchema } from '@yikart/common'
import { TaskPunishType } from '@yikart/task-db'
import { z } from 'zod'

export const createTaskPunishSchema = z.object({
  userTaskId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(TaskPunishType),
  title: z.string().min(1),
  amount: z.number().optional(),
  description: z.string().min(1),
  metadata: z.object().optional(),
})
export class CreateTaskPunishDto extends createZodDto(createTaskPunishSchema) {}

export const updateTaskPunishSchema = z.object({
  ...createTaskPunishSchema.partial().shape,
  id: z.string().min(1),
})
export class UpdateTaskPunishDto extends createZodDto(updateTaskPunishSchema) {}

export const queryTaskFilterSchema = z.object({
  taskId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
})
export const queryTaskPunishSchema = z.object({
  page: TableDtoSchema,
  filter: queryTaskFilterSchema,
})
export class QueryTaskPunishDto extends createZodDto(queryTaskPunishSchema) {}
