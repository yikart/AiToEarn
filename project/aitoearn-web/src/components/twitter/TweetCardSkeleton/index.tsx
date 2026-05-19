/**
 * TweetCardSkeleton - 推文卡片骨架屏
 */
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function TweetCardSkeleton({ compact, className }: { compact?: boolean, className?: string }) {
  return (
    <div className={cn('p-4 border-b border-border', className)}>
      <div className="flex gap-3">
        <Skeleton className={cn('shrink-0 rounded-full', compact ? 'h-8 w-8' : 'h-10 w-10')} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {!compact && (
            <>
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="flex gap-5">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
