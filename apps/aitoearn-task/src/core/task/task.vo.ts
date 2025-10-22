import { createZodDto } from '@yikart/common'
import { AccountType, TaskStatus, TaskType, UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

const objectIdToString = z.union([z.string()])
export const taskVoSchema = z.object({
  id: objectIdToString,
  title: z.string(),
  description: z.string(),
  type: z.enum(TaskType),
  maxRecruits: z.number(),
  currentRecruits: z.number(),
  deadline: z.date(),
  reward: z.number(),
  status: z.enum(TaskStatus),
  accountTypes: z.array(z.enum(AccountType)),
  taskData: z.object({
    targetWorksId: z.string().optional(),
    targetAuthorId: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
  materials: z.array(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const totalAmountVoSchema = z.object({
  totalAmount: z.number(),
})

export const userTaskVoSchema = z.object({
  id: objectIdToString,
  taskId: objectIdToString,
  userId: objectIdToString,
  status: z.enum(UserTaskStatus),
  accountId: z.string(),
  reward: z.number(),
})

export class TaskVo extends createZodDto(taskVoSchema) {}
export class TotalAmountVo extends createZodDto(totalAmountVoSchema) {}
export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
