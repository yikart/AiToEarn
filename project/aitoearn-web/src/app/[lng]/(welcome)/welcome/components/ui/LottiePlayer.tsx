/**
 * LottiePlayer - Lottie 动画播放组件
 * 用于替代 Webflow 的 Lottie 集成
 */

'use client'

import type { LottieComponentProps } from 'lottie-react'
import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface LottiePlayerProps {
  /** Lottie JSON 文件 URL */
  src: string
  /** 是否循环播放 */
  loop?: boolean
  /** 是否自动播放 */
  autoplay?: boolean
  /** 额外的 className */
  className?: string
  /** 播放速度 */
  speed?: number
  /** 当元素可见时才播放 */
  playOnView?: boolean
}

export function LottiePlayer({
  src,
  loop = true,
  autoplay = true,
  className,
  speed = 1,
  playOnView = false,
}: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState<LottieComponentProps['animationData']>(null)
  const [isInView, setIsInView] = useState(!playOnView)

  // 加载 Lottie JSON
  useEffect(() => {
    fetch(src)
      .then(res => res.json())
      .then(setAnimationData)
      .catch(console.error)
  }, [src])

  // IntersectionObserver 实现可见性检测
  useEffect(() => {
    if (!playOnView)
      return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    // 延迟获取 DOM 元素
    const timer = setTimeout(() => {
      const element = document.querySelector(`[data-lottie-src="${src}"]`)
      if (element) {
        observer.observe(element)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [playOnView, src])

  if (!animationData) {
    return <div className={cn('animate-pulse bg-muted', className)} />
  }

  return (
    <div data-lottie-src={src} className={className}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay && isInView}
        className="size-full"
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
        }}
      />
    </div>
  )
}
