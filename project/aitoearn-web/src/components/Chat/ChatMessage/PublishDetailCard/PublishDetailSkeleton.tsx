/**
 * PublishDetailSkeleton - 发布详情卡片骨架屏组件
 * 用于发布详情加载状态的占位显示
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface IPublishDetailSkeletonProps {
  className?: string
}

export function PublishDetailSkeleton({ className }: IPublishDetailSkeletonProps) {
  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
        className,
      )}
    >
      {/* 左侧：封面图骨架 - 移动端更小 */}
      <Skeleton className="w-14 h-14 sm:w-20 sm:h-20 rounded-md shrink-0" />

      {/* 右侧：内容骨架 */}
      <div className="flex-1 min-w-0">
        {/* 头部：账户信息 */}
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
            <Skeleton className="w-12 sm:w-16 h-3 rounded" />
          </div>
          <Skeleton className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded" />
        </div>

        {/* 标题 */}
        <Skeleton className="w-3/4 h-3 sm:h-4 rounded mb-0.5 sm:mb-1" />

        {/* 描述 */}
        <Skeleton className="w-full h-3 rounded mb-1 sm:mb-1.5" />

        {/* 状态 */}
        <Skeleton className="w-14 sm:w-16 h-5 rounded-full" />
      </div>
    </div>
  )
}

export default PublishDetailSkeleton
