import { createZodDto } from '@yikart/common'
import { TaskStatus, TaskType } from '@yikart/task-db'
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
  accountTypes: z.array(z.string()),
  taskData: z.object({
    type: z.string(),
    targetWorksId: z.string().optional(),
    targetAuthorId: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
  materialIds: z.array(z.string()).optional(),
  materials: z.array(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const taskListVoSchema = z.object({
  list: z.array(taskVoSchema),
  total: z.number(),
})

export const taskStatisticsVoSchema = z.object({
  totalTasks: z.number(),
  pendingTasks: z.number(),
  approvedTasks: z.number(),
  rejectedTasks: z.number(),
  totalReward: z.number(),
})

export class TaskVo extends createZodDto(taskVoSchema) {}
export class TaskListVo extends createZodDto(taskListVoSchema) {}
