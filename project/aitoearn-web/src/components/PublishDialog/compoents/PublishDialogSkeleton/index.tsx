/**
 * PublishDialogSkeleton 组件
 * 功能描述: 发布弹窗账号列表初次加载与预填加载时的骨架屏占位
 */

import { Skeleton } from '@/components/ui/skeleton'

interface PublishDialogSkeletonProps {
  isMobile: boolean
}

export function PublishDialogSkeleton({ isMobile }: PublishDialogSkeletonProps) {
  if (isMobile) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-background p-4" aria-hidden="true">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="mb-5 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-xl bg-background" aria-hidden="true">
      <div className="flex h-full w-full overflow-hidden rounded-xl border border-border">
        <div className="flex w-[52%] min-w-0 flex-col border-r border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>

          <div className="mb-4 rounded-xl border border-border bg-background p-4">
            <Skeleton className="mb-4 h-24 w-full rounded-lg" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-hidden rounded-xl border border-border bg-background p-4">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-16 rounded-md" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-background p-5">
          <div className="mb-5 flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          <div className="mb-5 flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex shrink-0 flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-4 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
