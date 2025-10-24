import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { taskVoSchema } from '../task.vo'

export const autoDataVoSchema = z.object({
  status: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
  message: z.string().optional(),
})

export const userTaskVoSchema = z.object({
  id: z.string(),
  userId: z.any(),
  taskId: z.any(),
  accountId: z.string(),
  status: z.string(),
  keepTime: z.number(),
  submissionUrl: z.string().optional(),
  taskMaterialId: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
  qrCodeScanResult: z.string().optional(),
  submissionTime: z.date().optional(),
  completionTime: z.date().optional(),
  rejectionReason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isFirstTimeSubmission: z.boolean(),
  verificationNote: z.string().optional(),
  reward: z.number(),
  rewardTime: z.date().optional(),
  verifiedBy: z.any().optional(),
  autoData: autoDataVoSchema.optional(),
})

export const userTaskListVoSchema = z.object({
  list: z.array(userTaskVoSchema),
  total: z.number(),
})
export const userTaskWithTaskVoSchema = userTaskVoSchema.extend({
  task: taskVoSchema,
})

export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
export class UserTaskListVo extends createZodDto(userTaskListVoSchema) {}
export class UserTaskWithTaskVo extends createZodDto(userTaskWithTaskVoSchema) {}
