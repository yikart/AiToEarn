import { AccountType } from '../interfaces'

export enum UserTaskStatus {
  DOING = 'doing', // 待提交
  WAITING = 'waiting', // 发布中
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 待结算
  SETTLED = 'settled', // 已结算
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已撤销
}

export interface UserTask {
  _id: string
  id: string
  userId: string
  taskId: string
  opportunityId?: string // 派发记录ID
  accountId: string
  accountType: AccountType
  uid: string
  status: UserTaskStatus
  keepTime: number // 保持时间(秒)
  submissionUrl?: string // 提交的视频、文章或截图URL
  submissionTime?: Date // 提交时间
  completionTime?: Date // 完成时间
  rejectionReason?: string // 拒绝原因
  metadata?: Record<string, unknown> // 额外信息，如审核反馈等
  isFirstTimeSubmission: boolean // 是否首次提交，用于确定是否给予首次奖励
  verifierUserId?: string // 核查人员ID
  verificationNote?: string // 人工核查备注
  reward: number // 奖励金额
  rewardTime?: Date // 奖励发放时间
  screenshotUrls?: string[] // 任务完成截图
  createdAt: Date
  updatedAt: Date
}

export enum TaskType {
  PROMOTION = 'promotion',
  INTERACTION = 'interaction',
}

export enum TaskStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  DEL = 'del',
}
export interface Task {
  _id: string
  id: string
  title: string
  description: string
  type: TaskType
  maxRecruits: number
  currentRecruits: number
  deadline: Date
  reward: number
  status: TaskStatus
  accountTypes: AccountType[]
  materialIds: string[]
  autoDeleteMaterial?: boolean
  createdAt: Date
  updatedAt: Date
}
