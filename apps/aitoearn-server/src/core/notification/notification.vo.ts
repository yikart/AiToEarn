import { createPaginationVo, createZodDto } from '@yikart/common'
import { NotificationStatus, NotificationType } from '@yikart/mongodb'
import { z } from 'zod'

const notificationVoSchema = z.object({
  id: z.any().or(z.string()),
  userId: z.any().or(z.string()),
  title: z.string(),
  content: z.string(),
  type: z.enum(NotificationType),
  status: z.enum(NotificationStatus),
  readAt: z.date().optional(),
  relatedId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const unreadCountVoSchema = z.object({
  count: z.number().int().min(0),
})

const operationResultVoSchema = z.object({
  affectedCount: z.number().int().min(0).optional(),
})

export class NotificationVo extends createZodDto(notificationVoSchema) {}
export class NotificationListVo extends createPaginationVo(notificationVoSchema) {}
export class UnreadCountVo extends createZodDto(unreadCountVoSchema) {}
export class OperationResultVo extends createZodDto(operationResultVoSchema) {}
