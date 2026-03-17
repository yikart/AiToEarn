import { createZodDto, NotificationMessageKey, NotificationType } from '@yikart/common'
import { NotificationStatus } from '@yikart/mongodb'
import { z } from 'zod'

const NotificationTypeEmailControlSchema = z.object({
  email: z.boolean(),
})

const UpdateNotificationControlDtoSchema = z.object({
  controls: z.record(
    z.enum(NotificationType),
    NotificationTypeEmailControlSchema,
  ),
})
export class UpdateNotificationControlDto extends createZodDto(
  UpdateNotificationControlDtoSchema,
  'UpdateNotificationControlDto',
) {}

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
  userId: z.string().min(1).describe('目标用户 ID'),
  messageKey: z.enum(NotificationMessageKey).optional().describe('通知消息模板 key'),
  vars: z.record(z.string(), z.unknown()).optional().describe('模板变量'),
  title: z.string().optional().describe('通知标题（messageKey 不存在时使用）'),
  content: z.string().optional().describe('通知内容（messageKey 不存在时使用）'),
  type: z.enum(NotificationType).default(NotificationType.TaskReminder).describe('通知类型'),
  relatedId: z.string().describe('关联资源 ID'),
  data: z.any().optional().describe('附加数据'),
})
export class CreateToUserDto extends createZodDto(CreateToUserSchema, 'CreateToUserDto') { }
