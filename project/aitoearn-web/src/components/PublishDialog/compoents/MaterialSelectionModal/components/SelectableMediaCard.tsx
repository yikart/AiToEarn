/**
 * SelectableMediaCard - 可选择的媒体卡片
 * 用于素材选择器中展示和选择媒体
 * 支持 hover 动效和选中状态
 */

'use client'

import type { SelectableMediaCardProps } from '../types'
import { motion } from 'framer-motion'
import { Check, Image as ImageIcon, Play, Video } from 'lucide-react'
import Image from 'next/image'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'

export function SelectableMediaCard({
  media,
  selected,
  multiSelect,
  onClick,
}: SelectableMediaCardProps) {
  const isVideo = media.type === 'video'
  const needAutoThumb = isVideo && !media.thumbUrl
  const autoThumbUrl = useVideoThumbnail(needAutoThumb ? media.url : null)
  const thumbUrl = getOssUrl(media.thumbUrl || autoThumbUrl || media.url)

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(media)}
      className={cn(
        'relative w-full text-left rounded-xl border-2 bg-card overflow-hidden cursor-pointer group',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'hover:shadow-lg',
        selected
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-transparent hover:border-primary/50',
      )}
    >
      {/* 媒体预览区域 */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {/* 缩略图 */}
        <Image
          src={thumbUrl}
          alt={media.title}
          fill
          className={cn('object-cover transition-transform duration-300', 'group-hover:scale-105')}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* 视频播放图标覆盖层 */}
        {isVideo && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/20',
              'opacity-100 group-hover:opacity-100 transition-opacity',
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-blue-500 ml-0.5" />
            </div>
          </div>
        )}

        {/* 多选勾选框 */}
        {multiSelect && (
          <div
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm',
              selected
                ? 'bg-primary border-primary scale-110'
                : 'bg-white/90 border-gray-300 hover:border-primary hover:scale-105',
            )}
          >
            {selected && <Check className="w-4 h-4 text-white" />}
          </div>
        )}

        {/* 单选模式下的 hover 指示器 */}
        {!multiSelect && !isVideo && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors',
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
              )}
            >
              <Check className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}

        {/* 类型图标 */}
        <div
          className={cn(
            'absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm',
            isVideo ? 'bg-blue-500/90' : 'bg-green-500/90',
          )}
        >
          {isVideo ? (
            <Video className="w-3 h-3 text-white" />
          ) : (
            <ImageIcon className="w-3 h-3 text-white" />
          )}
        </div>

        {/* 选中遮罩 */}
        {selected && <div className="absolute inset-0 bg-primary/10 pointer-events-none" />}
      </div>
    </motion.button>
  )
}
