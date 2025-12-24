import type { AccountType } from './types/account.type'
import http from '@/utils/request'

export enum TaskOpportunityStatus {
  PENDING = 'pending', // 待接取
  ACCEPTED = 'accepted', // 已接取
  EXPIRED = 'expired', // 已过期
}

export interface TaskOpportunity {
  _id: string
  id: string
  taskId: string
  accountId: string
  userId: string
  accountType: AccountType
  uid: string
  status: TaskOpportunityStatus
  expiredAt: Date
  metadata?: Record<string, any> // 额外信息，如匹配得分等
}

export enum UserTaskStatus {
  DOING = 'doing', // 进行中
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除或回退
}

interface UserTaskAutoData {
  status: -1 | 0 | 1
  message?: string
}

export interface UserTask {
  _id: string
  id: string
  userId: string
  taskId: string
  accountId: string
  accountType: AccountType
  uid: string
  status: UserTaskStatus
  keepTime: number // 保持时间(秒)
  submissionUrl?: string // 提交的视频、文章或截图URL
  submissionTime?: Date // 提交时间
  taskMaterialId?: string // 任务的素材ID
  screenshotUrls?: string[] // 任务完成截图
  qrCodeScanResult?: string // 二维码扫描结果
  completionTime?: Date // 完成时间
  rejectionReason?: string // 拒绝原因
  metadata?: Record<string, any> // 额外信息，如审核反馈等
  isFirstTimeSubmission: boolean // 是否首次提交，用于确定是否给予首次奖励
  verificationNote?: string // 人工核查备注
  reward: number // 奖励金额
  rewardTime?: Date // 奖励发放时间
  verifiedBy?: string // 核查人员ID
  autoData?: UserTaskAutoData // 自动任务数据
}

// 获取待接受的任务列表
export function apiGetTaskOpportunityList(params: {
  page?: number
  pageSize?: number
}) {
  return http.get<{ list: TaskOpportunity[] }>(`task/opportunity/list/${params.page}/${params.pageSize}`)
}


// 获取已接受的任务列表
export function apiGetUserTaskList(params: {
  page?: number
  pageSize?: number
}) {
  return http.get<{ list: UserTask[] }>(`task/userTask/list/${params.page}/${params.pageSize}`)
}

/**
 * 已接受的任务详情
 * @param id
 * @returns
 */
export function apiGetUserTaskDetail(id: string) {
  return http.get<any>(`task/userTask/info/${id}`)
}


/**
 * 获取未读任务数量
 * @returns 未读任务数量
 */
export function apiGetNotViewCount() {
  return http.put<{ count: number }>('task/opportunity/getNotViewCount')
}

/**
 * 标记任务为已读
 * @param opportunityId 任务机会ID
 * @returns
 */
export function apiMarkTaskAsViewed(opportunityId: string) {
  return http.put<any>(`task/opportunity/doView/${opportunityId}`)
}
