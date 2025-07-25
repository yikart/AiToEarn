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

export enum UserVipCycleType {
  NONE = 0, // 未认证
  MONTH = 1, // 月
  YEAR = 2, // 年
}
