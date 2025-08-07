import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const userTaskVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  status: z.string(),
  accountType: z.string(),
  uid: z.string(),
  account: z.string(),
  reward: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
})

export class UserTaskVo extends createZodDto(userTaskVoSchema) {}

export const userTaskWithTaskVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  status: z.string(),
  accountType: z.string(),
  uid: z.string(),
  account: z.string(),
  reward: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  task: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.string(),
      deadline: z.date(),
      status: z.string(),
    })
    .optional(),
})

export class UserTaskWithTaskVo extends createZodDto(
  userTaskWithTaskVoSchema,
) {}

export const userTaskListVoSchema = z.object({
  list: z.array(userTaskWithTaskVoSchema),
  total: z.number(),
})

export class UserTaskListVo extends createZodDto(userTaskListVoSchema) {}
