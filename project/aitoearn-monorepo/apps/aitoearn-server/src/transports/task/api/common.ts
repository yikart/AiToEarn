import { AccountType } from '@yikart/common'

export enum TaskType {
  VIDEO = 'video',
  ARTICLE = 'article',
  PROMOTION = 'promotion',
  INTERACTION = 'interaction',
}
export enum UserTaskStatus {
  DOING = 'doing', // 进行中
  PENDING = 'pending', // 待提现奖励
  APPROVED = 'approved', // 已通过（完成）
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消
  DEL = 'del', // 已删除或回退
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
  taskMaterialId?: string // 任务的素材ID
  screenshotUrls?: string[] // 任务完成截图
  createdAt: Date
  updatedAt: Date
}

export enum TaskOpportunityStatus {
  PENDING = 'pending', // 待接取
  ACCEPTED = 'accepted', // 已接取
  EXPIRED = 'expired', // 已过期
}

export interface TaskOpportunity {
  _id: string
  id: string
  taskId: string
  reward?: number
  accountId?: string
  nickname?: string
  userId: string
  userName?: string
  mail?: string
  accountType?: AccountType
  accountTypes?: AccountType[]
  uid?: string
  status: TaskOpportunityStatus
  isView?: boolean
  expiredAt: Date
  metadata?: Record<string, any> // 额外信息，如匹配得分等
  createdAt: Date
  updatedAt: Date
}

export interface UserPortraitReportData {
  userId: string
  name?: string
  avatar?: string
  status?: number
  lastLoginTime?: Date
  contentTags?: Record<string, number>
  totalFollowers?: number
  totalWorks?: number
  totalViews?: number
  totalLikes?: number
  totalCollects?: number
}

export enum TaskStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  DEL = 'del',
}

export class InteractionTaskData {
  type: string
  targetWorksId: string
  targetAuthorId?: string
  platform?: string
}

export class Task {
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
  taskData?: InteractionTaskData
  materialIds: string[]
  materialGroupId?: string // 草稿箱ID
  autoDeleteMaterial?: boolean
  autoDispatch?: boolean // 是否自动派发 用户创建时
  createdAt: Date
  updatedAt: Date
}
