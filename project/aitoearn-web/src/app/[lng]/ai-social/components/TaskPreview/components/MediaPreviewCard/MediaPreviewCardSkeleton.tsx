/**
 * MediaPreviewCardSkeleton - 媒体预览卡片骨架屏
 * 功能：在数据加载时显示占位效果
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MediaPreviewCardSkeletonProps {
  /** 自定义类名 */
  className?: string
}

/**
 * MediaPreviewCardSkeleton - 媒体预览卡片骨架屏
 */
export function MediaPreviewCardSkeleton({ className }: MediaPreviewCardSkeletonProps) {
  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-card', className)}>
      {/* 缩略图骨架 - 16:9 比例 */}
      <div className="relative aspect-video">
        <Skeleton className="absolute inset-0 rounded-none" />

        {/* 类型徽章骨架 */}
        <Skeleton className="absolute top-2 right-2 w-7 h-7 rounded-full" />

        {/* 底部信息骨架 */}
        <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

export default MediaPreviewCardSkeleton
