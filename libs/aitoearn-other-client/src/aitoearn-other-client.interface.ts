import { Pagination } from '@yikart/common'

// ==================== 通用枚举 ====================

export enum AppPlatform {
  Android = 'android',
  IOS = 'ios',
  Windows = 'windows',
  MacOS = 'macos',
}

export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
}

export enum NotificationType {
  System = 'system',
  Task = 'task',
  Payment = 'payment',
  Other = 'other',
}

export enum FeedbackType {
  Feedback = 'feedback',
  Bug = 'bug',
  Suggestion = 'suggestion',
}

// ==================== AppRelease 模块接口 ====================

// 版本链接接口
export interface AppReleaseLinks {
  store?: string
  direct: string
}

// ==================== AppRelease DTO 接口 ====================

// 创建版本发布 DTO
export interface CreateAppReleaseDto {
  platform: AppPlatform
  version: string
  buildNumber: number
  forceUpdate: boolean
  notes: string
  links: AppReleaseLinks
  publishedAt: string
}

// 更新版本发布 DTO
export interface UpdateAppReleaseDto {
  id: string
  platform?: AppPlatform
  version?: string
  buildNumber?: number
  forceUpdate?: boolean
  notes?: string
  links?: AppReleaseLinks
  publishedAt?: string
}

// 删除版本发布 DTO
export interface DeleteAppReleaseDto {
  id: string
}

// 获取版本发布详情 DTO
export interface GetAppReleaseByIdDto {
  id: string
}

// 查询版本发布列表 DTO
export interface QueryAppReleaseDto extends Pagination {
  platform?: AppPlatform
}

// 检查版本 DTO
export interface CheckVersionDto {
  platform: AppPlatform
  currentVersion: string
  currentBuildNumber?: number
}

// ==================== AppRelease VO 接口 ====================

// 版本发布信息 VO
export interface AppReleaseVo {
  id: string
  platform: AppPlatform
  version: string
  buildNumber: number
  forceUpdate: boolean
  notes: string
  links: AppReleaseLinks
  publishedAt: string
  createdAt?: string
  updatedAt?: string
}

// 版本检查结果 VO
export interface CheckVersionVo {
  hasUpdate: boolean
  forceUpdate: boolean
  latestVersion: string
  latestBuildNumber: number
  currentVersion: string
  currentBuildNumber: number
  notes: string
  links: AppReleaseLinks
  publishedAt: string
}

// 操作结果 VO
export interface OperationResultVo {
  success?: boolean
  affectedCount?: number
}

// ==================== Notification 模块接口 ====================

export interface CreateNotificationsByUserDto {
  userId: string
  title: string
  content: string
  type: NotificationType
  relatedId: string
  data?: Record<string, unknown>
}

export interface QueryNotificationsDto extends Pagination {
  userId: string
  status?: NotificationStatus
  type?: NotificationType
}

export interface MarkAsReadDto {
  userId: string
  notificationIds: string[]
}

export interface BatchDeleteDto {
  userId: string
  notificationIds: string[]
}

export interface GetUnreadCountDto {
  userId: string
}

export interface NotificationVo {
  id: string
  userId: string
  title: string
  content: string
  type: NotificationType
  status: NotificationStatus
  readAt?: string
  relatedId: string
  createdAt: string
  updatedAt: string
}

export interface UnreadCountVo {
  count: number
}

export type LanguageKey
  = | 'en'
    | 'ar'
    | 'bs'
    | 'bg'
    | 'ca'
    | 'zh_hans'
    | 'zh_hant'
    | 'zh'
    | 'hr'
    | 'cs'
    | 'da'
    | 'nl'
    | 'et'
    | 'fi'
    | 'fr'
    | 'ka'
    | 'de'
    | 'el'
    | 'hi'
    | 'he'
    | 'hu'
    | 'id'
    | 'it'
    | 'ja'
    | 'ko'
    | 'lv'
    | 'lt'
    | 'ms'
    | 'nb'
    | 'pl'
    | 'fa'
    | 'pt'
    | 'pa'
    | 'ro'
    | 'ru'
    | 'sr'
    | 'sk'
    | 'es'
    | 'sv'
    | 'th'
    | 'tr'
    | 'uk'
    | 'vi'

export interface PushNotificationDto {
  userIds: string[]
  contents: Record<LanguageKey, string>
  headings?: Record<LanguageKey, string>
  subtitle?: Record<LanguageKey, string>
  name?: string
  ios_attachments?: { id: string }
  big_picture?: string
  huawei_big_picture?: string
  adm_big_picture?: string
  chrome_web_image?: string
  small_icon?: string
  huawei_small_icon?: string
  adm_small_icon?: string
  large_icon?: string
  huawei_large_icon?: string
  adm_large_icon?: string
  chrome_web_icon?: string
  firefox_icon?: string
  chrome_web_badge?: string
  android_channel_id?: string
  existing_android_channel_id?: string
  huawei_channel_id?: string
  huawei_existing_channel_id?: string
  huawei_category?: 'MARKETING' | 'IM' | 'VOIP' | 'SUBSCRIPTION' | 'TRAVEL' | 'HEALTH' | 'WORK' | 'ACCOUNT' | 'EXPRESS' | 'FINANCE' | 'DEVICE_REMINDER' | 'MAIL'
  huawei_msg_type?: 'message' | 'data'
  huawei_bi_tag?: string
  priority?: 5 | 10
  ios_interruption_level?: 'active' | 'passive' | 'time_sensitive' | 'critical'
  ios_sound?: string
  ios_badgeType?: 'None' | 'SetTo' | 'Increase'
  ios_badgeCount?: number
  android_accent_color?: string
  huawei_accent_color?: string
  url?: string
  app_url?: string
  web_url?: string
  target_content_identifier?: string
  buttons?: unknown[]
  web_buttons?: unknown[]
  thread_id?: string
  ios_relevance_score?: string
  android_group?: string
  adm_group?: string
  ttl?: number
  collapse_id?: string
  web_push_topic?: string
  data?: Record<string, unknown>
  content_available?: boolean
  ios_category?: string
  apns_push_type_override?: string
  send_after?: string
  delayed_option?: string
  delivery_time_of_day?: string
  throttle_rate_per_minute?: number
  enable_frequency_cap?: boolean
  idempotency_key?: string
  template_id?: string
  custom_data?: Record<string, unknown>
}

// ==================== Feedback 模块接口 ====================

export interface CreateFeedbackDto {
  userId: string
  userName: string
  content: string
  type?: FeedbackType
  tagList?: string[]
  fileUrlList?: string[]
}

export interface FeedbackVo {
  id: string
  userId: string
  userName: string
  content: string
  type: FeedbackType
  tagList?: string[]
  fileUrlList?: string[]
  createdAt: string
  updatedAt: string
}

// ==================== Blog 模块接口 ====================

export interface CreateBlogDto {
  userId: string
  userName: string
  content: string
  tagList?: string[]
  fileUrlList?: string[]
}

export interface BlogVo {
  id: string
  userId: string
  userName: string
  content: string
  tagList?: string[]
  fileUrlList?: string[]
  createdAt: string
  updatedAt: string
}

// ==================== AppConfig 模块接口 ====================

export interface GetAppConfigDto {
  appId: string
}

export interface UpdateConfigDto {
  appId: string
  key: string
  value: unknown
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdateConfigsDto {
  appId: string
  configs: Array<{
    key: string
    value: unknown
    description?: string
    metadata?: Record<string, unknown>
  }>
}

export interface DeleteConfigDto {
  appId: string
  key: string
}

export interface AppConfigListDto {
  filter: {
    appId?: string
    key?: string
  }
  page: {
    pageNo?: number
    pageSize?: number
  }
}

export interface AppConfigVo {
  appId: string
  key: string
  value: unknown
  description?: string
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface AppConfigListVo {
  list: AppConfigVo[]
  total: number
}
