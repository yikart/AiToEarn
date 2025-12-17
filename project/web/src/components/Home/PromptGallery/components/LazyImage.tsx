/**
 * LazyImage - 懒加载图片组件
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  fixedHeight?: boolean
}

export function LazyImage({
  src,
  alt,
  className,
  fixedHeight = false,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || imageSrc) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [src, imageSrc])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden',
        fixedHeight ? 'h-48' : '',
        className
      )}
    >
      {/* 骨架屏加载状态 */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* 图片 */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
        />
      )}

      {/* 错误状态 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-100">
          <ImageIcon className="w-6 h-6 mr-2 opacity-50" />
          加载失败
        </div>
      )}
    </div>
  )
}

