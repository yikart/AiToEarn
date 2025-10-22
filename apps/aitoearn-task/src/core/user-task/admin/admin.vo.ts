import { createZodDto } from '@yikart/common'
import { UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

const objectIdToString = z.union([z.string()])

// 用户任务 VO
export const userTaskVoSchema = z.object({
  id: objectIdToString,
  taskId: objectIdToString,
  userId: objectIdToString,
  accountId: z.string(),
  status: z.enum(UserTaskStatus),
  keepTime: z.number(),
  submissionUrl: z.string().optional(),
  taskMaterialId: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
  qrCodeScanResult: z.string().optional(),
  submissionTime: z.date().optional(),
  completionTime: z.date().optional(),
  rejectionReason: z.string().optional(),
  metadata: z.any().optional(),
  isFirstTimeSubmission: z.boolean(),
  verificationNote: z.string().optional(),
  reward: z.number(),
  rewardTime: z.date().optional(),
  verifiedBy: objectIdToString.optional(),
  autoData: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export class UserTaskVo extends createZodDto(userTaskVoSchema) {}

// 用户任务列表 VO
export const userTaskListVoSchema = z.object({
  list: z.array(userTaskVoSchema),
  total: z.number(),
})

export class UserTaskListVo extends createZodDto(userTaskListVoSchema) {}

// 审核结果 VO
export const auditResultVoSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  retry: z.boolean().optional(),
})

export class AuditResultVo extends createZodDto(auditResultVoSchema) {}

// 布尔结果 VO
export const booleanResultVoSchema = z.object({
  success: z.boolean(),
})

export class BooleanResultVo extends createZodDto(booleanResultVoSchema) {}

// 数字结果 VO
export const numberResultVoSchema = z.object({
  count: z.number(),
})

export class NumberResultVo extends createZodDto(numberResultVoSchema) {}
