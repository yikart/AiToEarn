/**
 * MediaPreviewList - 媒体预览列表组件
 * 功能：展示媒体素材网格列表，支持骨架屏和空状态
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { MediaPreviewCard } from '../MediaPreviewCard'
import { MediaPreviewCardSkeleton } from '../MediaPreviewCard/MediaPreviewCardSkeleton'

export interface MediaPreviewListProps {
  /** 媒体列表 */
  mediaList: MediaItem[]
  /** 是否加载中 */
  isLoading: boolean
  /** 骨架屏数量 */
  skeletonCount?: number
  /** 跳转链接（已弃用，保留兼容） */
  detailLink?: string
  /** 自定义类名 */
  className?: string
  /** 点击素材项的回调，传入索引 */
  onItemClick?: (index: number) => void
}

/**
 * MediaPreviewList - 媒体预览列表组件
 */
export function MediaPreviewList({
  mediaList,
  isLoading,
  skeletonCount = 4,
  className,
  onItemClick,
}: MediaPreviewListProps) {
  const { t } = useTransClient('chat')

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <MediaPreviewCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  // 空状态
  if (mediaList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[180px] text-muted-foreground text-sm">
        {t('home.noData')}
      </div>
    )
  }

  // 媒体列表
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {mediaList.map((media, index) => (
        <MediaPreviewCard key={media._id} media={media} onClick={() => onItemClick?.(index)} />
      ))}
    </div>
  )
}

export default MediaPreviewList
