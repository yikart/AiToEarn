import { Material } from '@yikart/mongodb'

export enum TaskType {
  VIDEO = 'video',
  ARTICLE = 'article',
  PROMOTION = 'promotion',
  INTERACTION = 'interaction',
}

export interface Task {
  id: string
  title: string
  description: string
  reward: number
  maxRecruits: number
  currentRecruits: number
  status: TaskStatus
  deadline: Date
  accountTypes: string[]
  createdAt: Date
  updatedAt: Date
  materials: Material[]
}

export interface UserTask {
  id: string
  taskId: string
  userId: string
  status: UserTaskStatus
  accountId: string
  reward: number
  createdAt: Date
  updatedAt: Date
  keepTime: number
  submissionUrl: string
  taskMaterialId: string
  screenshotUrls: string[]
  qrCodeScanResult: string
  submissionTime: string
  completionTime: string
  rejectionReason: string
  metadata: unknown
  isFirstTimeSubmission: boolean
  verificationNote: string
  rewardTime: string
  verifiedBy: string
  autoData: unknown
}

export enum TaskStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserTaskStatus {
  DODING = 'doding',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface CreateTaskRequest {
  title: string
  description: string
  type: TaskType
  maxRecruits: number
  deadline: string
  reward: number
  accountTypes: string[]
  materialGroupId: string
  autoDeleteMaterial: boolean
  autoDispatch?: boolean
}

export interface TaskListRequest {
  page: {
    pageNo?: number
    pageSize?: number
  }
  filter?: {
    status?: string
    keyword?: string
  }
}

export interface TaskOpportunityList {
  page: {
    pageNo: number
    pageSize: number
  }
  filter: {
    userId?: string
    taskId: string
  }
}

export interface CreateMaterialRequest {
  taskId: string
}

export interface CreateNotificationRequest {
  title: string
  content: string
  type: string
  userIds: string[]
}

export interface AdminQueryNotificationsRequest {
  status?: string
  type?: string
  userId?: string
  pageNo?: number
  pageSize?: number
}

export interface AdminDeleteNotificationsRequest {
  notificationIds: string[]
}

export interface UserTaskListRequest {
  page: {
    pageNo?: number
    pageSize?: number
  }
  filter?: {
    status?: string
    taskId?: string
    userId?: string
  }
}

export enum TaskPunishStatus {
  WAITING = 0, // 等待处理
  PASS = 1, // 通过
  REJECT = 2, // 拒绝
}

export enum TaskPunishType {
  // 作品删除
  WORK_DELETED = `work_deleted`,
  // 发布内容不合规
  WORK_ILLEGAL = `work_illegal`,
  // 账号违规
  ACCOUNT_ILLEGAL = `account_illegal`,
  // 账号被封禁
  ACCOUNT_BANNED = `account_banned`,
}

export interface TaskPunish {
  _id: string
  id: string
  taskId: string
  userTaskId: string
  taskOpportunityId: string
  title: string
  userId: string
  status: TaskPunishStatus
  type: TaskPunishType
  amount: number // 分
  description: string
  metadata?: Record<string, unknown>
}
