export enum IncomeType {
  TASK = 'task', // 任务
  TASK_BACK = 'task_back', // 任务回退
  REWARD_BACK = 'reward_back', // 奖励回退
  TASK_WITHDRAW = 'task_withdraw', // 任务提现
}

// 新 API 枚举类型
export enum Currency {
  Cny = 'CNY',
  Unk = 'UNK',
  Usd = 'USD',
}

export enum IncomeStatus {
  Pending = 'pending',
  Withdrawn = 'withdrawn',
}

export enum IncomeTypeEnum {
  RewardBack = 'reward_back',
  Task = 'task',
  TaskBack = 'task_back',
  TaskWithdraw = 'task_withdraw',
}

// 收入记录请求参数
export interface IncomeListRequest {
  currency?: Currency
  page?: number
  pageSize?: number
  status?: IncomeStatus
  type?: IncomeTypeEnum
  [property: string]: any
}

// 订单类型 (根据实际API返回结构)
export interface IncomeRecord {
  _id: string
  id: string
  userId: string
  amount: number
  relId?: string
  type: IncomeType | IncomeTypeEnum
  desc?: string
  metadata?: Record<string, unknown>
  // 提现状态：1=可提现，0=已申请 或 pending/withdrawn
  status?: number | IncomeStatus
  createdAt: Date
  updatedAt: Date
  currency?: Currency
}
