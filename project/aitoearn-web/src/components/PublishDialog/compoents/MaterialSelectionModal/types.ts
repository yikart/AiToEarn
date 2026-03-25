/**
 * MaterialSelectionModal - 类型定义
 * 素材选择器弹窗的类型定义
 */

import type { MediaGroup, MediaItem } from '@/api/types/media'

/**
 * 媒体类型
 */
export type MediaType = 'video' | 'img'

/**
 * 素材选择器弹窗属性
 */
export interface MaterialSelectionModalProps {
  /** 弹窗是否打开 */
  open: boolean
  /** 弹窗状态改变回调 */
  onOpenChange: (open: boolean) => void
  /**
   * 允许的媒体类型
   * - 单个类型：'video' 或 'img'
   * - 多个类型：['video', 'img'] 同时支持视频和图片
   * 注意：图片支持多选，视频仅单选
   */
  mediaTypes: MediaType | MediaType[]
  /** 选中回调：图片返回数组，视频返回单个 */
  onSelect: (media: MediaItem | MediaItem[]) => void
}

/**
 * 分组卡片属性
 */
export interface GroupCardProps {
  /** 分组数据 */
  group: MediaGroup
  /** 点击回调 */
  onClick: (group: MediaGroup) => void
}

/**
 * 可选择媒体卡片属性
 */
export interface SelectableMediaCardProps {
  /** 媒体数据 */
  media: MediaItem
  /** 是否选中 */
  selected: boolean
  /** 是否为多选模式 */
  multiSelect: boolean
  /** 点击回调 */
  onClick: (media: MediaItem) => void
}

// 重新导出类型供外部使用
export type { MediaGroup, MediaItem }
