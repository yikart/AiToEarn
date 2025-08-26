import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

const queryNotificationsDtoSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const notificationDetailDtoSchema = z.object({
  id: z.string().min(1),
})

const markAsReadDtoSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

const batchDeleteDtoSchema = z.object({
  notificationIds: z.array(z.string().min(1)).min(1),
})

const getUnreadCountDtoSchema = z.object({
  type: z.string().optional(),
})

export class QueryNotificationsDto extends createZodDto(
  queryNotificationsDtoSchema,
) {}
export class NotificationDetailDto extends createZodDto(
  notificationDetailDtoSchema,
) {}
export class MarkAsReadDto extends createZodDto(markAsReadDtoSchema) {}
export class BatchDeleteDto extends createZodDto(batchDeleteDtoSchema) {}
export class GetUnreadCountDto extends createZodDto(getUnreadCountDtoSchema) {}
