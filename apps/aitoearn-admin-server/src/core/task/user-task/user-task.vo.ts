import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const userTaskVoSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  status: z.string(),
  accountId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),

  keepTime: z.number(),
  submissionUrl: z.string().optional(),
  taskMaterialId: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
  qrCodeScanResult: z.string().optional(),
  submissionTime: z.string().optional(),
  completionTime: z.string().optional(),
  rejectionReason: z.string().optional(),
  metadata: z.any().optional(),
  isFirstTimeSubmission: z.boolean(),
  verificationNote: z.string().optional(),
  reward: z.number(),
  rewardTime: z.string().optional(),
  verifiedBy: z.string().optional(),
  autoData: z.any().optional(),
})

const userTaskListVoSchema = z.object({
  list: z.array(userTaskVoSchema),
  total: z.number(),
})

export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
export class UserTaskListVo extends createZodDto(userTaskListVoSchema) {}
