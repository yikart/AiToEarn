/**
 * MediaCardSkeleton - 媒体卡片骨架屏
 * 用于列表加载时的占位显示
 */

import { Skeleton } from '@/components/ui/skeleton'

export function MediaCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 媒体区域骨架 */}
      <div className="relative aspect-square">
        <Skeleton className="absolute inset-0" />
        {/* 类型图标骨架 */}
        <Skeleton className="absolute bottom-2 left-2 w-6 h-6 rounded-full" />
      </div>

      {/* 内容区域骨架 */}
      <div className="p-3 space-y-2">
        {/* 标题骨架 */}
        <Skeleton className="h-4 w-3/4" />
        {/* 描述骨架 */}
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
