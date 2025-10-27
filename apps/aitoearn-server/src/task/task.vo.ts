import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const taskVoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  maxRecruits: z.number(),
  currentRecruits: z.number(),
  deadline: z.string(),
  reward: z.number(),
  status: z.string(),
  accountTypes: z.array(z.string()),
  taskData: z
    .object({
      // infoByOpportunityId 返回的 taskData 不包含 type 字段
      targetWorksId: z.string().optional(),
      targetAuthorId: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
  materials: z.array(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const taskWithOpportunityVoSchema = z.object({
  // task fields
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  maxRecruits: z.number(),
  currentRecruits: z.number(),
  deadline: z.string(),
  reward: z.number(),
  status: z.string(),
  accountTypes: z.array(z.string()),
  taskData: z
    .object({
      targetWorksId: z.string().optional(),
      targetAuthorId: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
  materials: z.array(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // opportunity fields (flattened)
  opportunityId: z.string(),
  opportunityStatus: z.string(),
  expiredAt: z.string(),
  accountId: z.string(),
})

export const totalAmountVoSchema = z.object({
  totalAmount: z.number(),
})

export const userTaskVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  status: z.string(),
  reward: z.number(),
  accountId: z.string(),
})

export class TaskVo extends createZodDto(taskVoSchema) {}
export class TaskWithOpportunityVo extends createZodDto(taskWithOpportunityVoSchema) {}
export class TotalAmountVo extends createZodDto(totalAmountVoSchema) {}
export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
