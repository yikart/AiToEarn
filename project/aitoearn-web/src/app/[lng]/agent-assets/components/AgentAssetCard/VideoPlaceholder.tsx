/**
 * VideoPlaceholder - 视频占位图组件
 * 当视频没有封面时显示，自动适配深色/浅色主题
 */

import { Video } from 'lucide-react'
import { memo } from 'react'
import { cn } from '@/lib/utils'

interface VideoPlaceholderProps {
  /** 自定义类名 */
  className?: string
}

export const VideoPlaceholder = memo(({ className }: VideoPlaceholderProps) => {
  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full flex items-center justify-center bg-muted',
        className,
      )}
    >
      {/* 圆形图标容器 */}
      <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
        <Video className="w-8 h-8 text-muted-foreground/50" />
      </div>
    </div>
  )
})

VideoPlaceholder.displayName = 'VideoPlaceholder'
