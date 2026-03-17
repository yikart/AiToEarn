/**
 * ReviewCard - 评价卡片组件
 * 使用 Tailwind CSS 重写
 */

'use client'

import type { Review } from '../../data/reviews'
import { Star } from 'lucide-react'
import Image from 'next/image'

import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: Review
  className?: string
}

/** 5 星评分组件 */
function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className="size-3.5 fill-foreground text-foreground" />
      ))}
    </div>
  )
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const { t } = useTransClient('welcome')

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-5 shadow-sm',
        className,
      )}
    >
      {/* 星级评分 */}
      <StarRating />

      {/* 评价内容 */}
      <p className="mt-3 text-sm leading-relaxed">
        {t(review.contentKey)}
      </p>

      {/* 用户信息 */}
      <div className="mt-4 flex items-center gap-2">
        <div className="relative size-8 overflow-hidden rounded-full">
          <Image
            src={review.avatar}
            alt={review.name}
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
        <span className="text-xs text-muted-foreground">{review.name}</span>
      </div>
    </div>
  )
}
