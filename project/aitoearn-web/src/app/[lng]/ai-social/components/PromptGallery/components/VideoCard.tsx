/**
 * VideoCard 组件
 * 展示视频封面和标题的卡片组件，支持悬停效果
 */
'use client'

import type { VideoCardProps } from '../types'
import { Play } from 'lucide-react'
import Image from 'next/image'
import { memo } from 'react'
import { cn } from '@/lib/utils'

export const VideoCard = memo(({ item, onClick, size = 'horizontal' }: VideoCardProps) => {
  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-card',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10',
        'dark:hover:shadow-black/30',
        // 根据 size 设置不同的高度
        size === 'vertical' ? 'h-full' : '',
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* 封面图 */}
      <div
        className={cn(
          'relative w-full overflow-hidden',
          // 竖视频使用全高度，横视频使用 16:9 比例
          size === 'vertical' ? 'h-full' : 'aspect-video',
        )}
      >
        <Image
          src={item.cover}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* 悬停时的播放图标 */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/30 opacity-0 transition-opacity duration-300',
            'group-hover:opacity-100',
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              'bg-white/90 text-foreground shadow-lg',
              'transition-transform duration-300 group-hover:scale-110',
            )}
          >
            <Play className="h-6 w-6 fill-current" />
          </div>
        </div>

        {/* 底部标题遮罩 */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 p-3',
            'bg-gradient-to-t from-black/70 to-transparent',
          )}
        >
          <h3
            className={cn(
              'line-clamp-2 text-sm font-medium text-white',
              'transition-colors duration-200',
            )}
          >
            {item.title}
          </h3>
        </div>
      </div>
    </div>
  )
})
