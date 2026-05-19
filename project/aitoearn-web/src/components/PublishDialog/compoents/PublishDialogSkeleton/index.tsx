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
    <div className="absolute inset-0 z-50 rounded-lg bg-background p-5" aria-hidden="true">
      <div className="flex h-full gap-4">
        <div className="flex w-[720px] flex-col rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>

          <div className="mb-5 flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex shrink-0 flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-4 rounded-xl border border-border bg-background p-4">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <div className="flex w-[360px] flex-col rounded-lg border border-border bg-card p-5">
          <Skeleton className="mb-5 h-6 w-24" />
          <Skeleton className="mb-4 aspect-[9/16] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
