import http from '@/utils/request'

// 通知类型枚举（与后端保持一致）
export enum NotificationType {
  AgentResult = 'agent_result',
  AppRelease = 'app_release',
  AiReviewSkipped = 'ai_review_skipped',
  InteractionAiReviewFailed = 'interaction_ai_review_failed',
  DiscountCodeAssigned = 'discount_code_assigned',
  TrustScoreDeducted = 'trust_score_deducted',
  AgentResultRequiresAction = 'agent_result_requires_action',
  AgentForwarded = 'agent_forwarded',
}

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: NotificationType | 'system' | 'user' | 'material' | 'other'
  status: 'read' | 'unread'
  readAt?: string
  createdAt: string
  updatedAt: string
  relatedId?: string
  userId?: string
}

export interface NotificationListResponse {
  list: NotificationItem[]
  total: number
  page: number
  pageSize: number
}

export interface NotificationDetailResponse {
  data: NotificationItem
}

export interface UnreadCountResponse {
  count: number
}

// 通知控制项
export interface NotificationControlItem {
  type: string
  email: boolean
}

// 通知控制响应
export interface NotificationControlResponse {
  controls: NotificationControlItem[]
}

// 更新通知控制请求
export interface UpdateNotificationControlRequest {
  controls: Record<string, { email: boolean }>
}

// 获取用户通知列表
export function getNotificationList(params: { page?: number, pageSize?: number, type?: string }) {
  return http.get<NotificationListResponse>('notification', params)
}

// 获取通知详情
export function getNotificationDetail(id: string) {
  return http.get(`notification/${id}`)
}

// 标记通知为已读
export function markNotificationAsRead(notificationIds: string[]) {
  return http.put(`notification/read`, { notificationIds })
}

// 全部标记为已读
export function markAllNotificationsAsRead() {
  return http.put('notification/read-all')
}

// 获取未读数量
export function getUnreadCount() {
  return http.get<UnreadCountResponse>('notification/unread-count', undefined, true)
}

// 删除通知
export function deleteNotifications(notificationIds: string[]) {
  return http.delete('notification', { notificationIds })
}

// 获取通知控制设置
export function getNotificationControl() {
  return http.get<NotificationControlResponse>('notification/control')
}

// 更新通知控制设置
export function updateNotificationControl(data: UpdateNotificationControlRequest) {
  return http.put<NotificationControlResponse>('notification/control', data)
}
