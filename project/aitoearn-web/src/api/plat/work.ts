/**
 * 作品归属校验 API
 * 用于 CPM/CPE 任务在提交前校验作品是否归属于指定账号
 */

import type { PlatType } from '@/app/config/platConfig'
import http from '@/utils/request'

export interface ValidateWorkOwnershipDto {
  /** 账号 ID */
  accountId: string
  /** 作品链接 */
  workLink: string
}

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

export interface ValidateWorkOwnershipVo {
  accountId: string
  accountType: PlatType
  authorizationStatus: 'valid'
  /** 作品归属校验结果 */
  ownershipVerified: boolean
  dataId: string
  uniqueId: string
  /** 解析后的作品链接 */
  resolvedWorkLink?: string
  type: string
  videoType?: 'short' | 'long'
  workDetail?: ValidateWorkOwnershipWorkDetail
}

/**
 * 校验作品归属
 * POST /channel/work/validate
 */
export function apiValidateWorkOwnership(data: ValidateWorkOwnershipDto) {
  return http.post<ValidateWorkOwnershipVo>('/channel/work/validate', data)
}
