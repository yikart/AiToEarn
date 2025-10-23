export enum WithdrawRecordStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
}

export enum WithdrawRecordType {
  TASK = 'task', // 任务
  REWARD = 'reward', // 奖励
}

export interface WithdrawRecord {
  id: string
  userId: string
  flowId?: string
  userWalletAccountId?: string
  type: WithdrawRecordType
  amount: number
  incomeRecordId?: string
  relId?: string
  desc?: string // 备注
  screenshotUrls?: string[] // 发放截图列表
  status: WithdrawRecordStatus
  createdAt: Date
  updatedAt: Date
}
