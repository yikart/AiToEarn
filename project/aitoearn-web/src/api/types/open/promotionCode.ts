/**
 * 公开推广码接口类型定义
 * 用于推广者侧获取素材信息
 */

import type { PlatType } from '@/app/config/platConfig'

/**
 * 素材媒体项
 */
export interface MaterialMedia {
  url: string
  type: 'video' | 'img'
  thumbUrl?: string
}

/**
 * 最优素材信息（通过 GET /material/optimal?groupId=xxx&accountType=xxx 获取）
 */
export interface OptimalMaterialVo {
  _id: string
  title?: string
  desc?: string
  topics?: string[]
  coverUrl?: string
  mediaList?: MaterialMedia[]
  useCount: number
  option: any
  /** 平台类型 */
  platform: PlatType
}
