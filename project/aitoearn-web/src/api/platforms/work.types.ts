import type { PlatType } from '@/app/config/platConfig'

// Source: platforms/work.api.ts inline types
// Source: plat/work.ts

/**
 * ValidateWorkOwnershipDto 请求参数。
 */
export interface ValidateWorkOwnershipDto {

  accountId: string

  workLink: string
}

/**
 * ValidateWorkOwnershipWorkDetail 数据结构。
 */
export interface ValidateWorkOwnershipWorkDetail {
  dataId: string
  title?: string
  desc?: string
  topics?: string[]
  coverUrl?: string
  videoUrl?: string
  imgUrlList?: string[]
  publishTime?: string
  type: string
  videoType?: 'short' | 'long'
  duration?: number
}

/**
 * ValidateWorkOwnershipVo 响应数据。
 */
export interface ValidateWorkOwnershipVo {
  accountId: string
  accountType: PlatType
  authorizationStatus: 'valid'

  ownershipVerified: boolean
  dataId: string
  uniqueId: string

  resolvedWorkLink?: string
  type: string
  videoType?: 'short' | 'long'
  workDetail?: ValidateWorkOwnershipWorkDetail
}
