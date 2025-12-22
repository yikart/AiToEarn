// 旧枚举（保留兼容）
export enum WithdrawRecordType {
  TASK = 'task', // 任务
  REWARD = 'reward', // 奖励
}

// 旧状态枚举（保留兼容）
export enum WithdrawRecordStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
  TASK_WITHDRAW = 2, // 任务提现
}

// 新API枚举
export enum Currency {
  Cny = 'CNY',
  Unk = 'UNK',
  Usd = 'USD',
}

export enum WithdrawType {
  Reward = 'reward',
  Task = 'task',
}

export enum WithdrawStatus {
  Approved = 'approved',
  Failed = 'failed',
  Paid = 'paid',
  Pending = 'pending',
  Rejected = 'rejected',
}

// 旧接口（保留兼容）
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

// 新API接口
export interface WalletAccountSnapshot {
  [key: string]: string
}

export interface WithdrawRecordNew {
  id: string
  userId: string
  amount: number
  currency: Currency
  type: WithdrawType
  status: WithdrawStatus
  walletAccountId: string
  walletAccountSnapshot?: WalletAccountSnapshot
  incomeRecordIds?: string[]
  relId?: string
  flowId?: string
  stripeTransferId?: string
  adminId?: string
  adminNote?: string
  screenshotUrls?: string[]
  paidAt?: Date
  metadata?: { [key: string]: any }
  createdAt: Date
  updatedAt: Date
}

// 创建提现申请请求
export interface CreateWithdrawRequest {
  amount: number
  currency: Currency
  incomeRecordIds?: string[]
  metadata?: { [key: string]: any }
  relId?: string
  type: WithdrawType
  walletAccountId: string
  [property: string]: any
}

// 获取提现记录列表请求
export interface GetWithdrawListRequest {
  currency?: Currency
  page?: number
  pageSize?: number
  status?: WithdrawStatus
  type?: WithdrawType
  [property: string]: any
}

// 提现全部待提现收入请求
export interface WithdrawAllPendingRequest {
  currency: Currency
  type?: WithdrawType
  walletAccountId: string
  [property: string]: any
}
