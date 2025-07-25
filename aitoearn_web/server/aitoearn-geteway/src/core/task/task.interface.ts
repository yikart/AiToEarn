export interface TaskDetail {
  id: string
  title: string
  description: string
  type: string
  maxRecruits: number
  currentRecruits: number
  deadline: Date
  reward: number
  status: string
  accountTypes: string[]
  taskData?: {
    type: string
    targetWorksId?: string
    targetAuthorId?: string
    platform?: string
  }
  createdAt: Date
  updatedAt: Date
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
  reward: number
  createdAt: Date
}
