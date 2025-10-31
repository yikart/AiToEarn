export enum IncomeType {
  TASK = 'task', // 任务
  TASK_BACK = 'task_back', // 任务回退
  REWARD_BACK = 'reward_back', // 奖励回退
}

export enum UserStatus {
  STOP = 0,
  OPEN = 1,
  DELETE = -1,
}

export interface User {
  id: string
  name: string
  mail: string
  avatar?: string
  phone?: string
  status: UserStatus
  createdAt: Date
  updatedAt: Date
  score: number // 积分
  income: number // 收入（分）
  totalIncome: number
}
