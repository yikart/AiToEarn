import { createZodDto } from '@yikart/common'
import { NotificationStatus, NotificationType } from '@yikart/mongodb'
import { z } from 'zod'

const createNotificationSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(NotificationType),
  userIds: z.array(z.string().min(1)).min(1),
  relatedId: z.string().min(1),
})
export class CreateNotificationDto extends createZodDto(createNotificationSchema) {}

const adminQueryNotificationsSchema = z.object({
  status: z.enum(NotificationStatus).optional(),
  type: z.enum(NotificationType).optional(),
  userId: z.string().optional(),
  pageNo: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})
export class AdminQueryNotificationsDto extends createZodDto(adminQueryNotificationsSchema) {}

const adminDeleteNotificationsSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

export class AdminDeleteNotificationsDto extends createZodDto(adminDeleteNotificationsSchema) {}
