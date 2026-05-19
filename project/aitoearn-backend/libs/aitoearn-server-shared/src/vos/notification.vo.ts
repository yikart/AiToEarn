import { NotificationMessageKey, NotificationType, UserType } from '@yikart/common'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// NewNotification
// ---------------------------------------------------------------------------

export const NewNotificationSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.enum(UserType).describe('用户类型'),
  type: z.enum(NotificationType).describe('通知类型'),
  relatedId: z.string().describe('关联 ID'),
  messageKey: z.enum(NotificationMessageKey).optional().describe('消息 Key'),
  vars: z.record(z.string(), z.unknown()).optional().describe('模板变量'),
  title: z.string().optional().describe('标题'),
  content: z.string().optional().describe('内容'),
})
export interface NewNotification extends z.infer<typeof NewNotificationSchema> {}
