/**
 * NotificationSkeleton - 通知列表骨架屏
 * 初始加载时显示 5 个骨架项，匹配 NotificationItem 布局（纯图标无背景+合并元信息行）
 */

import { Skeleton } from '@/components/ui/skeleton'

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-4 sm:px-5 py-3.5">
      {/* 图标占位 */}
      <div className="w-7 flex items-start justify-center pt-0.5 shrink-0">
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        {/* 标题 */}
        <Skeleton className="h-4 w-40 rounded" />
        {/* 内容两行 */}
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
        {/* 元信息行：类型 · 时间 */}
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>
  )
}

export default function NotificationSkeleton() {
  return (
    <div className="space-y-0" data-testid="notification-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-border/30">
          <SkeletonItem />
        </div>
      ))}
    </div>
  )
}
