import { AccountType } from '@yikart/mongodb'

export interface NewAccountCrawlerData {
  accountId?: string
  userId?: string
  platform: AccountType
  uid: string // 频道平台唯一ID
  avatar?: string
  nickname?: string
}
