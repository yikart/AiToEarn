/**
 * VideoBackground - 背景视频组件
 * 用于替代 Webflow 的 w-background-video
 */

'use client'

import { cn } from '@/lib/utils'

interface VideoSource {
  mp4: string
  webm?: string
  poster?: string
}

interface VideoBackgroundProps {
  /** 桌面端视频源 */
  desktop?: VideoSource
  /** 移动端视频源 */
  mobile?: VideoSource
  /** 额外的 className */
  className?: string
  /** 桌面端隐藏类 */
  hideOnMobile?: boolean
  /** 移动端隐藏类 */
  hideOnDesktop?: boolean
}

export function VideoBackground({
  desktop,
  mobile,
  className,
  hideOnMobile = false,
  hideOnDesktop = false,
}: VideoBackgroundProps) {
  return (
    <>
      {/* 桌面端视频 */}
      {desktop && (
        <div
          className={cn(
            'absolute inset-0 overflow-hidden',
            hideOnMobile && 'hidden md:block',
            className,
          )}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={desktop.poster}
            className="size-full object-cover"
          >
            <source src={desktop.mp4} type="video/mp4" />
            {desktop.webm && <source src={desktop.webm} type="video/webm" />}
          </video>
        </div>
      )}
      {/* 移动端视频 */}
      {mobile && (
        <div
          className={cn(
            'absolute inset-0 overflow-hidden',
            hideOnDesktop && 'block md:hidden',
            className,
          )}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={mobile.poster}
            className="size-full object-cover"
          >
            <source src={mobile.mp4} type="video/mp4" />
            {mobile.webm && <source src={mobile.webm} type="video/webm" />}
          </video>
        </div>
      )}
    </>
  )
}
