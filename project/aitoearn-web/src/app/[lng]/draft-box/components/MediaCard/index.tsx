/**
 * MediaCard - 只读媒体卡片
 * 展示视频/图片缩略图，点击打开预览
 * 视频：缩略图 + 播放图标 + 时长
 * 图片：缩略图，保持原始比例
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import { Play } from 'lucide-react'
import { memo, useCallback } from 'react'
import { getOssUrl } from '@/utils/oss'
import { LazyImage } from '../LazyImage'

interface MediaCardProps {
  /** 媒体数据 */
  media: MediaItem
  /** 点击回调 */
  onClick: (media: MediaItem) => void
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

export const MediaCard = memo(({ media, onClick }: MediaCardProps) => {
  const isVideo = media.type === 'video'
  const thumbUrl = media.thumbUrl ? getOssUrl(media.thumbUrl) : media.url ? getOssUrl(media.url) : '/images/placeholder.png'
  const duration = (media.metadata as any)?.duration

  const handleClick = useCallback(() => {
    onClick(media)
  }, [media, onClick])

  return (
    <div
      className="mb-4 cursor-pointer group relative"
      onClick={handleClick}
    >
      <div className="relative w-full overflow-hidden rounded-xl">
        <LazyImage
          src={thumbUrl}
          alt={media.title || media.desc || '媒体'}
          width={400}
          height={300}
          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          skeletonClassName="rounded-xl"
          placeholderHeight={150}
          style={{ aspectRatio: 'auto' }}
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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
      </div>

      {/* 标题 */}
      {media.title && (
        <div className="pt-2 px-1">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {media.title}
          </p>
        </div>
      )}
    </div>
  )
})

MediaCard.displayName = 'MediaCard'
