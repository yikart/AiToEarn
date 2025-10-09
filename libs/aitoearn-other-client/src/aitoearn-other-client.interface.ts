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
