/**
 * AgentAssetCard - AI 生成素材卡片组件
 * 展示单个 AI 生成素材
 * 特点：
 * - 支持图片和视频类型
 * - 视频显示播放图标和时长
 * - 视频无封面时显示占位图
 * - 只读模式（无删除按钮）
 */

'use client'

import type { AssetVo } from '@/types/agent-asset'
import { Play } from 'lucide-react'
import { memo, useCallback } from 'react'
import { OssImage } from '@/components/common/OssImage'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { getAssetMediaType, getAssetThumbUrl } from '@/utils/agent/asset'
import { cn } from '@/utils/className'
import { formatSeconds } from '@/utils/format'
import { VideoPlaceholder } from './VideoPlaceholder'

interface AgentAssetCardProps {
  /** 素材数据 */
  asset: AssetVo
  /** 预览按钮无文件名时的可访问性文案 */
  previewLabel: string
  /** 点击回调 */
  onClick?: (asset: AssetVo) => void
}

export const AgentAssetCard = memo(({ asset, previewLabel, onClick }: AgentAssetCardProps) => {
  const mediaType = getAssetMediaType(asset)
  const rawThumbUrl = getAssetThumbUrl(asset)
  const isVideo = mediaType === 'video'
  const autoThumbUrl = useVideoThumbnail(isVideo && !rawThumbUrl ? asset.url : null)
  const thumbUrl = rawThumbUrl || autoThumbUrl
  const hasThumb = Boolean(thumbUrl)
  const duration = asset.metadata?.duration

  // 处理点击
  const handleClick = useCallback(() => {
    onClick?.(asset)
  }, [asset, onClick])

  return (
    <button
      type="button"
      aria-label={asset.filename || previewLabel}
      className={cn(
        'group relative block w-full rounded-lg overflow-hidden bg-muted cursor-pointer min-h-[120px] text-left',
        'transition-all duration-200',
        'hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
      onClick={handleClick}
    >
      {hasThumb ? (
        // 有封面：图片自然撑开高度，实现瀑布流错落效果
        <div className="relative">
          <OssImage
            src={thumbUrl}
            alt={asset.filename || ''}
            width={400}
            height={300}
            className="w-full h-auto block"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />

          {/* 视频播放图标 */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-foreground/60 flex items-center justify-center group-hover:bg-foreground/80 transition-colors">
                <Play className="w-5 h-5 text-background fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* 视频时长标签 */}
          {isVideo && duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-foreground/75 rounded text-xs text-background">
              {formatSeconds(Math.floor(duration))}
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
        </div>
      ) : (
        // 无封面：固定 16:9 占位
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <VideoPlaceholder />

          {/* 视频播放图标 */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-foreground/60 flex items-center justify-center group-hover:bg-foreground/80 transition-colors">
                <Play className="w-5 h-5 text-background fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* 悬浮遮罩 */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
        </div>
      )}
    </button>
  )
})

AgentAssetCard.displayName = 'AgentAssetCard'
