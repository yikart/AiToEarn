/**
 * AgentAssetCardSkeleton - AI 生成素材卡片骨架屏
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_HEIGHTS = [180, 240, 210, 280, 160]

interface AgentAssetCardSkeletonProps {
  index: number
}

export function AgentAssetCardSkeleton({ index }: AgentAssetCardSkeletonProps) {
  const height = SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length]

  return (
    <div className="rounded-lg overflow-hidden">
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
    </div>
  )
}
