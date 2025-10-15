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

const languageKeys = z.enum([
  'en',
  'ar',
  'bs',
  'bg',
  'ca',
  'zh_hans',
  'zh_hant',
  'zh',
  'hr',
  'cs',
  'da',
  'nl',
  'et',
  'fi',
  'fr',
  'ka',
  'de',
  'el',
  'hi',
  'he',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lv',
  'lt',
  'ms',
  'nb',
  'pl',
  'fa',
  'pt',
  'pa',
  'ro',
  'ru',
  'sr',
  'sk',
  'es',
  'sv',
  'th',
  'tr',
  'uk',
  'vi',
])

const pushNotificationDtoSchema = z.object({
  userIds: z.string().array(),
  contents: z.record(languageKeys, z.string()),
  headings: z.record(languageKeys, z.string()).optional(),
  subtitle: z.record(languageKeys, z.string()).optional(),
  name: z.string().max(128).optional(),
  ios_attachments: z.object({ id: z.string() }).optional(),
  big_picture: z.string().optional(),
  huawei_big_picture: z.string().optional(),
  adm_big_picture: z.string().optional(),
  chrome_web_image: z.string().optional(),
  small_icon: z.string().optional(),
  huawei_small_icon: z.string().optional(),
  adm_small_icon: z.string().optional(),
  large_icon: z.string().optional(),
  huawei_large_icon: z.string().optional(),
  adm_large_icon: z.string().optional(),
  chrome_web_icon: z.string().optional(),
  firefox_icon: z.string().optional(),
  chrome_web_badge: z.string().optional(),
  android_channel_id: z.string().optional(),
  existing_android_channel_id: z.string().optional(),
  huawei_channel_id: z.string().optional(),
  huawei_existing_channel_id: z.string().optional(),
  huawei_category: z.enum(['MARKETING', 'IM', 'VOIP', 'SUBSCRIPTION', 'TRAVEL', 'HEALTH', 'WORK', 'ACCOUNT', 'EXPRESS', 'FINANCE', 'DEVICE_REMINDER', 'MAIL']).optional(),
  huawei_msg_type: z.enum(['message', 'data']).optional(),
  huawei_bi_tag: z.string().optional(),
  priority: z.union([z.literal(5), z.literal(10)]).optional(),
  ios_interruption_level: z.enum(['active', 'passive', 'time_sensitive', 'critical']).optional(),
  ios_sound: z.string().optional(),
  ios_badgeType: z.enum(['None', 'SetTo', 'Increase']).optional(),
  ios_badgeCount: z.number().optional(),
  android_accent_color: z.string().optional(),
  huawei_accent_color: z.string().optional(),
  url: z.string().optional(),
  app_url: z.string().optional(),
  web_url: z.string().optional(),
  target_content_identifier: z.string().optional(),
  buttons: z.array(z.any()).optional(),
  web_buttons: z.array(z.any()).optional(),
  thread_id: z.string().optional(),
  ios_relevance_score: z.string().optional(),
  android_group: z.string().optional(),
  adm_group: z.string().optional(),
  ttl: z.number().min(0).max(2419200).optional(),
  collapse_id: z.string().optional(),
  web_push_topic: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  content_available: z.boolean().optional(),
  ios_category: z.string().optional(),
  apns_push_type_override: z.string().optional(),
  send_after: z.string().optional(),
  delayed_option: z.string().optional(),
  delivery_time_of_day: z.string().optional(),
  throttle_rate_per_minute: z.number().optional(),
  enable_frequency_cap: z.boolean().optional(),
  idempotency_key: z.string().optional(),
  template_id: z.string().optional(),
  custom_data: z.record(z.string(), z.any()).optional(),
})

export class AdminQueryNotificationsDto extends createZodDto(adminQueryNotificationsDtoSchema) {}
export class NotificationIdDto extends createZodDto(notificationIdDtoSchema) {}
export class MarkAsReadDto extends createZodDto(markAsReadDtoSchema) {}
export class BatchDeleteDto extends createZodDto(batchDeleteDtoSchema) {}
export class AdminBatchDeleteDto extends createZodDto(adminBatchDeleteDtoSchema) {}
export class GetUnreadCountDto extends createZodDto(getUnreadCountDtoSchema) {}
export class PushNotificationDto extends createZodDto(pushNotificationDtoSchema) {}
