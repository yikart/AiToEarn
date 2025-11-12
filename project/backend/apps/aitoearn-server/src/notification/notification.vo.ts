import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const notificationVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  status: z.string(),
  readAt: z.string().optional(),
  relatedId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const notificationListVoSchema = z.object({
  list: z.array(notificationVoSchema),
  total: z.number().int().min(0),
})

const unreadCountVoSchema = z.object({
  count: z.number().int().min(0),
})

const operationResultVoSchema = z.object({
  affectedCount: z.number().int().min(0).optional(),
})

export class NotificationVo extends createZodDto(notificationVoSchema) {}
export class NotificationListVo extends createZodDto(
  notificationListVoSchema,
) {}
export class UnreadCountVo extends createZodDto(unreadCountVoSchema) {}
export class OperationResultVo extends createZodDto(operationResultVoSchema) {}
