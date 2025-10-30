export interface TaskDetail {
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
  taskData?: {
    targetWorksId?: string
    targetAuthorId?: string
    platform?: string
  }
  createdAt: string
  updatedAt: string
}

export interface TaskWithOpportunityDetail extends TaskDetail {
  opportunityId: string
  opportunityStatus: string
  expiredAt: string
  accountId: string
}

export interface TotalAmountResult {
  totalAmount: number
}

export interface UserTaskDetail {
  id: string
  taskId: string
  userId: string
  status: string
  accountType: string
  uid: string
  account: string
  accountId: string
  reward: number
  createdAt: string
}
