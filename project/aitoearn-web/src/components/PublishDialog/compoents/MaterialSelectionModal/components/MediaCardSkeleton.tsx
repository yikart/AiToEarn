/**
 * MediaCardSkeleton - 媒体卡片骨架屏
 * 加载时的占位组件
 */

import { Skeleton } from '@/components/ui/skeleton'

export function MediaCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 预览区域骨架 */}
      <Skeleton className="aspect-square w-full" />

      {/* 标题骨架 */}
      <div className="p-2">
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}
