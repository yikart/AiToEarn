import { AccountType } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'

/**
 * 频道账号画像上报数据接口
 */
export interface TaskAccountPortraitData {
  accountId?: string
  userId?: string
  type: AccountType // AccountType
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
