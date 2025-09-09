export enum IncomeType {
  TASK = 'task', // 任务
  TASK_BACK = 'task_back', // 任务回退
  REWARD_BACK = 'reward_back', // 奖励回退
}

// 订单类型 (根据实际API返回结构)
export interface IncomeRecord {
  _id: string;
  id: string;
  userId: string;
  amount: number;
  relId?: string
  type: IncomeType
  desc?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
