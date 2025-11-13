export enum WithdrawRecordType {
  TASK = 'task', // 任务
  REWARD = 'reward', // 奖励
}

export enum WithdrawRecordStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
  TASK_WITHDRAW = 2, // 任务提现
}

export interface WithdrawRecord {
  _id: string
  id: string
  userId: string
  flowId?: string
  type: WithdrawRecordType
  amount: number
  incomeRecordId?: string
  relId?: string
  desc?: string
  screenshotUrls?: string[] // 发放截图列表
  status: WithdrawRecordStatus
  createdAt: Date
  updatedAt: Date
}
