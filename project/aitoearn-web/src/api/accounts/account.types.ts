import type { ClientType } from '@/app/[lng]/accounts/accounts.enums'
import type { PlatType } from '@/app/config/platConfig'

// Source: types/account.type.ts

/**
 * SocialAccount 类型。
 */
export interface SocialAccount {
  id: string
  type: PlatType
  loginCookie?: string
  access_token?: string
  refresh_token?: string
  loginTime?: string
  uid: string
  avatar: string
  nickname: string
  fansCount?: number
  followingCount?: number
  readCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  lastStatsTime?: string
  workCount?: number
  income?: number
  status: number
  createTime?: string
  updateTime?: string
  createdAt?: string
  updatedAt?: string
  rank: number
  groupId: string
  channelId?: string
  clientType?: ClientType
}

/**
 * CreateChannelAccountParams 请求参数。
 */
export interface CreateChannelAccountParams {
  type: PlatType
  uid: string
  nickname: string
  loginCookie?: string
  avatar?: string
  groupId?: string
}

/**
 * AccountListData 数据结构。
 */
export interface AccountListData {
  total: number
  list: SocialAccount[]
}

/**
 * AccountGroupItem 数据结构。
 */
export interface AccountGroupItem {
  id: string
  name: string
  rank?: number
  isDefault: boolean
  proxyIp?: string
  ip?: string
  location?: string
  countryCode?: string
  hasBrowserConfig?: boolean
  createdAt?: string
  updatedAt?: string
}

// Source: accounts/account.api.ts inline types
// Source: accountSort.ts
/**
 * SortRankItem 数据结构。
 */
export interface SortRankItem
{
  id: string
  rank: number
}

/**
 * SortRankRequest 请求参数。
 */
export interface SortRankRequest {
  list: SortRankItem[]
}
