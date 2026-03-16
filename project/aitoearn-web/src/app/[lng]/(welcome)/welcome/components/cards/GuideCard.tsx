/**
 * GuideCard - 指南卡片组件
 * 使用 Tailwind CSS 重写
 */

import type { Guide } from '../../data/guides'
import { Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface GuideCardProps {
  guide: Guide
  className?: string
}

export function GuideCard({ guide, className }: GuideCardProps) {
  const linkProps = guide.external
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  return (
    <Link
      href={guide.href}
      className={cn(
        'group relative block aspect-[4/3] overflow-hidden rounded-xl',
        className,
      )}
      {...linkProps}
    >
      {/* 背景图片 */}
      <Image
        src={guide.image}
        alt={guide.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* 内容 */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3 className="text-lg font-semibold leading-tight text-white">
          {guide.title}
        </h3>

        {/* 视频播放按钮 */}
        {guide.isVideo && (
          <div className="mt-3">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-white/30">
              <Play className="size-5 fill-white text-white" />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
