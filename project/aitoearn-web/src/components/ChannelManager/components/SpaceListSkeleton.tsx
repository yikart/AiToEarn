/**
 * SpaceListSkeleton - 空间列表骨架屏组件
 *
 * 功能：
 * - 显示加载状态的骨架屏
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Skeleton } from '@/components/ui/skeleton'

export function SpaceListSkeleton() {
  const { t } = useTransClient('account')

  return (
    <div className="space-y-4">
      {/* 骨架屏 */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-5 rounded" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* 频道骨架屏 */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-4 border-b last:border-b-0">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}

      {/* 加载动画 */}
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          {t('common.actions.loading', '加载中...')}
        </span>
      </div>
    </div>
  )
}
