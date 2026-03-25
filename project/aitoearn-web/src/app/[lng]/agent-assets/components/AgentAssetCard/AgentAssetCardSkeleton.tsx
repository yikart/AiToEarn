/**
 * AgentAssetCardSkeleton - Agent 素材卡片骨架屏
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function AgentAssetCardSkeleton() {
  // 随机高度，模拟瀑布流效果
  const randomHeight = Math.floor(Math.random() * 100) + 150

  return (
    <div className="rounded-lg overflow-hidden">
      <Skeleton className="w-full" style={{ height: `${randomHeight}px` }} />
    </div>
  )
}
