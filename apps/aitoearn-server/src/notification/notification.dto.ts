import { createZodDto } from '@yikart/common'
import { NotificationStatus, NotificationType } from '@yikart/mongodb'
import { z } from 'zod'

const queryNotificationsDtoSchema = z.object({
  status: z.enum(NotificationStatus).optional(),
  type: z.enum(NotificationType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export class QueryNotificationsDto extends createZodDto(
  queryNotificationsDtoSchema,
) { }

const notificationDetailDtoSchema = z.object({
  id: z.string().min(1),
})

const markAsReadDtoSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

const batchDeleteDtoSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})
export class BatchDeleteDto extends createZodDto(batchDeleteDtoSchema) { }

const getUnreadCountDtoSchema = z.object({
  type: z.enum(NotificationType).optional(),
})
export class GetUnreadCountDto extends createZodDto(getUnreadCountDtoSchema) { }

export class NotificationDetailDto extends createZodDto(
  notificationDetailDtoSchema,
) { }
export class MarkAsReadDto extends createZodDto(markAsReadDtoSchema) { }

const CreateToUserSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(NotificationType).default(NotificationType.TaskReminder),
  relatedId: z.string(),
  data: z.any().optional(),
})
export class CreateToUserDto extends createZodDto(CreateToUserSchema) { }
