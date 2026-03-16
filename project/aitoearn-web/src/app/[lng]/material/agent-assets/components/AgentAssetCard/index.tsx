/**
 * AgentAssetCard - Agent 素材卡片组件
 * 展示单个 Agent 生成的素材
 * 特点：
 * - 支持图片和视频类型
 * - 视频显示播放图标和时长
 * - 视频无封面时显示占位图
 * - 只读模式（无删除按钮）
 */

'use client'

import type { AssetVo } from '@/types/agent-asset'
import { Play } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback } from 'react'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { cn } from '@/lib/utils'
import { getAssetMediaType, getAssetThumbUrl } from '@/utils/agent-asset'
import { getOssUrl } from '@/utils/oss'
import { VideoPlaceholder } from './VideoPlaceholder'

interface AgentAssetCardProps {
  /** 素材数据 */
  asset: AssetVo
  /** 点击回调 */
  onClick?: (asset: AssetVo) => void
}

/**
 * 格式化视频时长
 */
function formatDuration(seconds?: number): string {
  if (!seconds)
    return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const AgentAssetCard = memo(({ asset, onClick }: AgentAssetCardProps) => {
  const mediaType = getAssetMediaType(asset)
  const rawThumbUrl = getAssetThumbUrl(asset)
  const isVideo = mediaType === 'video'
  const autoThumbUrl = useVideoThumbnail(isVideo && !rawThumbUrl ? asset.url : null)
  const thumbUrl = rawThumbUrl ? getOssUrl(rawThumbUrl) : autoThumbUrl ? getOssUrl(autoThumbUrl) : ''
  const hasThumb = !!thumbUrl
  const duration = asset.metadata?.duration

  // 处理点击
  const handleClick = useCallback(() => {
    onClick?.(asset)
  }, [asset, onClick])

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden bg-muted cursor-pointer min-h-[120px]',
        'transition-all duration-200',
        'hover:shadow-lg',
      )}
      onClick={handleClick}
    >
      {hasThumb ? (
        // 有封面：图片自然撑开高度，实现瀑布流错落效果
        <div className="relative">
          <Image
            src={thumbUrl}
            alt={asset.filename || 'Agent asset'}
            width={400}
            height={300}
            className="w-full h-auto block"
            unoptimized
          />

          {/* 视频播放图标 */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}

          {/* 视频时长标签 */}
          {isVideo && duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
              {formatDuration(duration)}
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      ) : (
        // 无封面：固定 16:9 占位
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <VideoPlaceholder />

          {/* 视频播放图标 */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      )}
    </div>
  )
})

AgentAssetCard.displayName = 'AgentAssetCard'
