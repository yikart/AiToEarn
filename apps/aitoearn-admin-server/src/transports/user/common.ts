export enum UserStatus {
  STOP = 0,
  OPEN = 1,
  DELETE = -1,
}

export enum EarnInfoStatus {
  CLOSE = 0,
  OPEN = 1,
}

export interface UserEarnInfo {
  status: EarnInfoStatus
  cycleInterval: number
}

export interface User {
  id: string
  name: string
  mail?: string
  phone?: string
  password?: string
  salt?: string
  status: UserStatus
  vipInfo?: UserVipInfo
  popularizeCode?: string // 我的推广码
  inviteUserId?: string // 邀请人用户ID
  inviteCode?: string // 我填写的邀请码
  earnInfo?: UserEarnInfo
  googleAccount?: GoogleAccount // 谷歌账号信息
}

export interface GoogleLoginInfo {
  clientId: string
  credential: string
}

export interface GoogleAccount {
  googleId: string
  email: string
  refreshToken?: string
  expiresAt?: number
}

export enum IncomeType {
  TASK = 'task', // 任务
  TASK_WITHDRAW = 'task_withdraw', // 任务提现扣除
  TASK_BACK = 'task_back', // 任务回退
  REWARD_BACK = 'reward_back', // 奖励回退
}

export enum VipStatus {
  none = 'none', // 无会员
  expired = 'expired', // 过期
  trialing = 'trialing', // 试用中
  monthly_once = 'monthly_once', // 包月一次性
  yearly_once = 'yearly_once', // 包年一次性
  active_monthly = 'active_monthly', // 连续包月中
  active_yearly = 'active_yearly', // 连续包年中
  active_nonrenewing = 'active_nonrenewing', // 有效(未续订)
  // pending_payment = 'pending_payment', // 支付中
  // unpaid = 'unpaid', // 支付失败
  // canceled = 'canceled', // 取消
}

export interface UserVipInfo {
  expireTime: Date
  status: VipStatus
  startTime: Date
}

export enum WalletAccountType {
  ZFB = 'ZFB',
  WX_PAY = 'WX_PAY',
}

export interface UserWalletAccount {
  id: string
  userId: string
  mail?: string
  userName: string
  account: string // 账号
  cardNum?: string // 身份证号
  phone?: string
  type: WalletAccountType
  isDef: boolean // 是否默认
  createdAt: Date
  updatedAt: Date
}

// 提现状态
export enum IncomeStatus {
  WAIT = 0, // 待提现
  DO = 1, // 已经提现
}
export interface IncomeRecord {
  id: string
  userId: string
  amount: number
  type: IncomeType
  status: IncomeStatus
  withdrawId?: string
  relId?: string
  desc?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
