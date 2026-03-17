/**
 * 草稿箱模块类型定义
 * 包含草稿组、素材、分页相关类型
 */

import type { PlatType } from '@/app/config/platConfig'
import type { PubType } from '@/app/config/publishConfig'

// ==================== 草稿组相关类型 ====================

/** 草稿组（素材组） */
export interface DraftGroup {
  _id: string
  name: string
  title?: string
  type: PubType
  /** 发布平台 */
  platform?: PlatType
  desc?: string
  createdAt?: string
  updatedAt?: string
  /** 组内素材数量 */
  mediaCount?: number
  /** 是否为默认组 */
  isDefault?: boolean
}

// ==================== 素材相关类型 ====================

/** 媒体资源类型 */
export type MaterialMediaType = 'img' | 'video'

/** 媒体资源 */
export interface MaterialMedia {
  url: string
  type: MaterialMediaType
  content?: string
}

/** 草稿素材 */
export interface DraftMaterial {
  _id: string
  groupId: string
  title: string
  desc?: string
  coverUrl?: string
  mediaList: MaterialMedia[]
  type?: PubType
  status: 0 | 1 // 0: 生成中, 1: 已生成
  location?: [number, number]
  option?: Record<string, unknown>
  createdAt?: string
  /** 使用次数 */
  useCount?: number
  /** 话题标签 */
  topics?: string[]
  /** AI 生成模型 */
  model?: string
}

// ==================== 分页相关类型 ====================

/** 分页信息 */
export interface Pagination {
  current: number
  pageSize: number
  total: number
  hasMore: boolean
}
