import { AccountStatus, AccountType } from '@yikart/mongodb'

export interface AccountPortraitReportData {
  accountId?: string
  userId?: string
  type: AccountType
  uid: string // 频道平台唯一ID
  avatar?: string
  nickname?: string
  status?: AccountStatus
  contentTags?: Record<string, number>
  totalFollowers?: number
  totalWorks?: number
  totalViews?: number
  totalLikes?: number
  totalCollects?: number
}
