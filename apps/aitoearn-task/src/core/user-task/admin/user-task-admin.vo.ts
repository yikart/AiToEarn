import { createZodDto } from '@yikart/common'
import { AccountType, UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

const objectIdToString = z.union([z.string()])

export const userTaskVoSchema = z.object({
  id: objectIdToString,
  taskId: objectIdToString,
  userId: objectIdToString,
  account: z.string(),
  accountType: z.enum(AccountType),
  status: z.enum(UserTaskStatus),
  submissionUrl: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
  qrCodeScanResult: z.string().optional(),
  submissionTime: z.date().optional(),
  verificationTime: z.date().optional(),
  verifierUserId: z.string().optional(),
  verificationNote: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const userTaskListVoSchema = z.object({
  list: z.array(userTaskVoSchema),
  total: z.number(),
})

export const userTaskStatisticsVoSchema = z.object({
  approvedTaskCount: z.number(),
  approvedUserCount: z.number(),
  totalReward: z.number(),
})

export const auditResultVoSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  retry: z.boolean().optional(),
})

export const booleanResultVoSchema = z.object({
  success: z.boolean(),
})

export const numberResultVoSchema = z.object({
  count: z.number(),
})

export class UserTaskVo extends createZodDto(userTaskVoSchema) {}
export class UserTaskListVo extends createZodDto(userTaskListVoSchema) {}
export class UserTaskStatisticsVo extends createZodDto(userTaskStatisticsVoSchema) {}
export class AuditResultVo extends createZodDto(auditResultVoSchema) {}
export class BooleanResultVo extends createZodDto(booleanResultVoSchema) {}
export class NumberResultVo extends createZodDto(numberResultVoSchema) {}
