import { createZodDto } from '@yikart/common'
import { NotificationStatus, NotificationType } from '@yikart/mongodb'
import { z } from 'zod'

const createNotificationsByUserSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(1000),
  type: z.enum(NotificationType),
  relatedId: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
})
export class CreateNotificationsByUserDto extends createZodDto(createNotificationsByUserSchema) {}

const queryNotificationsSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(NotificationStatus).optional(),
  type: z.enum(NotificationType).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})
export class QueryNotificationsDto extends createZodDto(queryNotificationsSchema) {}

const adminQueryNotificationsDtoSchema = z.object({
  status: z.enum(NotificationStatus).optional(),
  type: z.enum(NotificationType).optional(),
  userId: z.string().optional(),
  pageNo: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

const notificationIdDtoSchema = z.object({
  id: z.string().min(1),
})

const markAsReadDtoSchema = z.object({
  userId: z.string().min(1),
  notificationIds: z.array(z.string().min(1)).min(1),
})

const batchDeleteDtoSchema = z.object({
  userId: z.string().min(1),
  notificationIds: z.array(z.string().min(1)).min(1),
})

const adminBatchDeleteDtoSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

const getUnreadCountDtoSchema = z.object({
  userId: z.string().min(1),
})

export class AdminQueryNotificationsDto extends createZodDto(adminQueryNotificationsDtoSchema) {}
export class NotificationIdDto extends createZodDto(notificationIdDtoSchema) {}
export class MarkAsReadDto extends createZodDto(markAsReadDtoSchema) {}
export class BatchDeleteDto extends createZodDto(batchDeleteDtoSchema) {}
export class AdminBatchDeleteDto extends createZodDto(adminBatchDeleteDtoSchema) {}
export class GetUnreadCountDto extends createZodDto(getUnreadCountDtoSchema) {}
