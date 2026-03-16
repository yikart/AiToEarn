/**
 * GroupCardSkeleton - 分组卡片骨架屏
 * 加载时的占位组件
 */

import { Skeleton } from '@/components/ui/skeleton'

export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 封面骨架 */}
      <Skeleton className="aspect-[16/10] w-full" />

      {/* 内容骨架 */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
