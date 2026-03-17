/**
 * GroupCardSkeleton - 分组卡片骨架屏
 * 用于列表加载时的占位显示
 */

import { Skeleton } from '@/components/ui/skeleton'

export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* 封面区域骨架 */}
      <div className="relative aspect-[16/10]">
        <Skeleton className="absolute inset-0" />
        {/* 类型徽章骨架 */}
        <Skeleton className="absolute bottom-3 left-3 w-12 h-5 rounded-full" />
        {/* 资源数量骨架 */}
        <Skeleton className="absolute bottom-3 right-3 w-16 h-5 rounded-full" />
      </div>

      {/* 内容区域骨架 */}
      <div className="p-3 space-y-2">
        {/* 标题骨架 */}
        <Skeleton className="h-5 w-3/4" />
        {/* 描述骨架 */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
