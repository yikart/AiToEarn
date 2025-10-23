import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const taskVoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reward: z.number(),
  maxRecruits: z.number(),
  currentRecruits: z.number(),
  status: z.string(),
  deadline: z.string().or(z.date()),
  accountTypes: z.array(z.string()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  materials: z.array(z.any()).optional(),
  materialIds: z.array(z.string()).optional(),
})

const taskListVoSchema = z.object({
  list: z.array(taskVoSchema),
  total: z.number(),
})

const booleanResultVoSchema = z.object({
  success: z.boolean(),
})

export class TaskVo extends createZodDto(taskVoSchema) {}
export class TaskListVo extends createZodDto(taskListVoSchema) {}
export class BooleanResultVo extends createZodDto(booleanResultVoSchema) {}
