import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const taskVoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  maxRecruits: z.number(),
  currentRecruits: z.number(),
  deadline: z.date(),
  reward: z.number(),
  status: z.string(),
  accountTypes: z.array(z.string()),
  taskData: z
    .object({
      type: z.string(),
      targetWorksId: z.string().optional(),
      targetAuthorId: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const totalAmountVoSchema = z.object({
  totalAmount: z.number(),
})

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
})

export class TaskVo extends createZodDto(taskVoSchema) {}
export class TotalAmountVo extends createZodDto(totalAmountVoSchema) {}
export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
