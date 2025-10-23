import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const notificationVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  status: z.string(),
  readAt: z.date().optional(),
  relatedId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const notificationListVoSchema = z.object({
  list: z.array(notificationVoSchema),
  total: z.number(),
  page: z.number(),
})

export class NotificationVo extends createZodDto(notificationVoSchema) {}
export class NotificationListVo extends createZodDto(notificationListVoSchema) {}
