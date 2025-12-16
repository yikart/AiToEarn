/**
 * TaskCardSkeleton - 任务卡片骨架屏组件
 * 用于任务卡片加载状态的占位显示
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export interface ITaskCardSkeletonProps {
  /** 自定义类名 */
  className?: string
}

/**
 * TaskCardSkeleton - 任务卡片骨架屏
 */
export function TaskCardSkeleton({ className }: ITaskCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-4 rounded-xl border border-gray-100 bg-white',
        className,
      )}
    >
      {/* 图标骨架 */}
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />

      {/* 标题骨架 */}
      <Skeleton className="w-full h-4 rounded mb-2" />
      <Skeleton className="w-3/4 h-4 rounded mb-2" />

      {/* 时间骨架 */}
      <Skeleton className="w-16 h-3 rounded mt-auto" />
    </div>
  )
}

export default TaskCardSkeleton

