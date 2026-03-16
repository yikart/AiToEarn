/**
 * MediaPreviewCard - 媒体预览卡片组件
 * 功能：在首页展示媒体素材预览，支持点击跳转到详情
 */

'use client'

import type { MediaItem } from '@/app/[lng]/material/materialStore/materialStore.types'
import { Image as ImageIcon, Play, Video } from 'lucide-react'
import Image from 'next/image'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { cn, formatRelativeTime } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

export interface MediaPreviewCardProps {
  /** 媒体数据 */
  media: MediaItem
  /** 点击回调 */
  onClick?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * MediaPreviewCard - 媒体预览卡片组件
 */
export function MediaPreviewCard({ media, onClick, className }: MediaPreviewCardProps) {
  const isVideo = media.type === 'video'
  const needAutoThumb = isVideo && !media.thumbUrl
  const autoThumbUrl = useVideoThumbnail(needAutoThumb ? media.url : null)
  const thumbUrl = getOssUrl(media.thumbUrl || autoThumbUrl || media.url)

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-xl overflow-hidden bg-card cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:scale-[1.02]',
        className,
      )}
    >
      {/* 缩略图区域 - 16:9 比例 */}
      <div className="relative aspect-video bg-muted">
        <Image
          src={thumbUrl}
          alt={media.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 25vw"
        />

        {/* 视频播放图标 */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-blue-500 ml-0.5" />
            </div>
          </div>
        )}

        {/* 类型徽章 - 右上角 */}
        <div
          className={cn(
            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm',
            isVideo ? 'bg-blue-500/90' : 'bg-green-500/90',
          )}
        >
          {isVideo ? (
            <Video className="w-3.5 h-3.5 text-white" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-white" />
          )}
        </div>

        {/* 渐变遮罩 + 信息 */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
          <h4 title={media.title} className="text-sm font-medium text-white truncate">
            {media.title || 'Untitled'}
          </h4>
          <span className="text-xs text-white/70">
            {formatRelativeTime(new Date(media.createdAt))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MediaPreviewCard
