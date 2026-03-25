/**
 * 品牌推广模块类型定义
 * 包含推广计划、素材、统计数据相关类型
 */

import type { PlatType } from '@/app/config/platConfig'
import type { PubType } from '@/app/config/publishConfig'

// ==================== 推广计划相关类型 ====================

/** 推广计划（原草稿组） */
export interface PromotionPlan {
  id: string
  name: string
  title?: string // 兼容旧数据
  type: PubType
  /** 发布平台 */
  platform?: PlatType
  desc?: string
  createdAt?: string
  updatedAt?: string
  /** 计划内素材数量 */
  mediaCount?: number
  /** 是否为默认计划 */
  isDefault?: boolean
  /** 统计数据 */
  statistics?: PlanStatistics
}

/** 推广计划统计数据 */
export interface PlanStatistics {
  /** 素材数 */
  materialCount: number
  /** 发布数 */
  publishCount: number
  /** 浏览量 */
  viewCount: number
  /** 点赞数 */
  likeCount: number
  /** 评论数 */
  commentCount: number
  /** 分享数 */
  shareCount: number
  /** 收藏数 */
  favoriteCount: number
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

/** 推广素材（原草稿） */
export interface PromotionMaterial {
  id: string
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
  /** 适用的频道类型 */
  accountTypes?: string[]
}

// ==================== 发布记录相关类型 ====================

/** 发布记录（来自 API 响应） */
export interface PublishRecord {
  id: string
  materialGroupId: string
  dataId: string
  /** 账号 ID */
  accountId: string
  /** 平台类型 */
  accountType: string
  uid: string
  /** 标题 */
  title: string
  /** 描述 */
  desc: string
  /** 封面图 */
  coverUrl: string
  /** 视频链接 */
  videoUrl: string
  /** 作品链接 */
  workLink: string
  /** 发布时间 */
  publishTime: string
  /** 状态 */
  status: number
  /** 创建时间 */
  createdAt: string
  /** 浏览量 */
  viewCount: number
  /** 点赞数 */
  likeCount: number
  /** 评论数 */
  commentCount: number
  /** 分享数 */
  shareCount: number
  /** 收藏数 */
  favoriteCount: number
  /** 数据更新时间 */
  insightUpdatedAt: string
  /** 平台名称（前端补充） */
  platformName?: string
  /** 平台图标（前端补充） */
  platformIcon?: string
}

// ==================== 趋势数据类型 ====================

/** 趋势数据点 */
export interface TrendDataPoint {
  date: string
  value: number
}

/** 趋势数据 */
export interface TrendData {
  viewCount: TrendDataPoint[]
  likeCount: TrendDataPoint[]
  commentCount: TrendDataPoint[]
  shareCount: TrendDataPoint[]
}

// ==================== 分页相关类型 ====================

/** 分页信息 */
export interface Pagination {
  current: number
  pageSize: number
  total: number
  hasMore: boolean
}

// ==================== Store 状态类型 ====================

/** 列表页 Store 状态 */
export interface IBrandPromotionStoreState {
  // 推广计划列表状态
  plans: PromotionPlan[]
  plansLoading: boolean
  plansPagination: Pagination

  // 弹窗状态
  createPlanModalOpen: boolean
  editingPlan: PromotionPlan | null
  qrCodeDialogOpen: boolean
  qrCodePlan: PromotionPlan | null

  // 加载状态
  isSubmitting: boolean
}

/** 列表页 Store 方法 */
export interface IBrandPromotionStoreMethods {
  // 推广计划方法
  fetchPlans: (page?: number) => Promise<void>
  createPlan: (data: { name: string }) => Promise<boolean>
  updatePlan: (id: string, data: { name?: string }) => Promise<boolean>
  deletePlan: (id: string) => Promise<boolean>

  // 弹窗控制
  openCreatePlanModal: () => void
  openEditPlanModal: (plan: PromotionPlan) => void
  closePlanModal: () => void
  openQRCodeDialog: (plan: PromotionPlan) => void
  closeQRCodeDialog: () => void

  // 重置
  reset: () => void
}

export type IBrandPromotionStore = IBrandPromotionStoreState & IBrandPromotionStoreMethods
