import http from '@/utils/request'

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: 'system' | 'user' | 'material' | 'other' | 'task_reminder'
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

// 获取用户通知列表
export function getNotificationList(params: {
  page?: number
  pageSize?: number
  type?: string
}) {
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

// 任务相关类型定义
export interface TaskData {
  targetWorksId: string
  targetAuthorId: string
  platform: string
}

export interface TaskItem {
  id: string
  title: string
  description: string
  type: string
  maxRecruits: number
  currentRecruits: number
  deadline: string
  reward: number
  status: string
  accountTypes: string[]
  taskData: TaskData
  materials: string[]
  createdAt: string
  updatedAt: string
  opportunityId: string
  opportunityStatus: string
  expiredAt: string
  accountId: string
  materialIds: string[]
}

export interface TaskResponse {
  data: TaskItem
}

// 获取任务详情
export function getTaskDetail(opportunityId: string) {
  return http.get<TaskResponse>(`task/task/opportunity/info/${opportunityId}`)
}

// 接受任务
export function acceptTask(taskId: string, opportunityId: string, accountId?: string) {
  return http.post('task/accept', { taskId, opportunityId, accountId })
}

// 提交任务
export function submitTask(userTaskId: string, materialId?: string) {
  return http.post('task/submit', { userTaskId, materialId })
}
