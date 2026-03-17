import { CreditsType } from '@yikart/common'
import { EarnInfoStatus } from '@yikart/mongodb'

export interface UserEarnInfo {
  status: EarnInfoStatus
  cycleInterval: number
}

export interface UserStorage {
  total: number // Total Storage (Bytes)
  expiredAt?: Date
}

export interface UserInfo {
  id: string
  name: string
  mail: string
  phone?: string
  avatar?: string
  status: number
  isDelete: boolean
  popularizeCode?: string
  inviteUserId?: string
  inviteCode?: string
  score: number
  googleAccount?: Record<string, unknown>
  earnInfo?: UserEarnInfo
  createdAt: Date
  updatedAt: Date
  usedStorage: number // 已用存储（Bytes）
  storage: UserStorage
  tenDayExpPoint: number
}

export interface AddCreditsDto {
  userId: string
  amount: number
  type: CreditsType
  description?: string
  metadata?: Record<string, unknown>
  expiredAt?: Date | null
}

export interface DeductCreditsDto {
  userId: string
  amount: number
  type: CreditsType
  description?: string
  metadata?: Record<string, unknown>
}
