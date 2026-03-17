/**
 * ReviewsSection - 评价网格区块
 * 使用 Tailwind CSS + Embla Carousel 重写
 */

'use client'

import { Github } from 'lucide-react'

import { useTransClient } from '@/app/i18n/client'
import { useGitHubStars } from '@/app/layout/shared/hooks/useGitHubStars'

import {
  allReviews,
  reviewsColumnLeft,
  reviewsColumnMiddle,
  reviewsColumnRight,
} from '../../data/reviews'
import { ReviewCard } from '../cards/ReviewCard'
import {
  Carousel,
  CarouselContent,
  CarouselSlide,
} from '../ui/Carousel'

export function ReviewsSection() {
  const { t } = useTransClient('welcome')
  const starCount = useGitHubStars()

  return (
    <section className="py-16 md:py-24" style={{ backgroundImage: 'linear-gradient(#fff, #f0eae1 40%)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* 头部 - 居中布局 */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* 标题 */}
          <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
            {t('reviews.title')}
          </h2>
        </div>

        {/* 桌面端：三列网格 + 渐变遮罩 */}
        <div className="relative mt-10">
          <div className="hidden gap-4 md:grid md:grid-cols-3">
            {/* 左列 */}
            <div className="flex flex-col gap-3">
              {reviewsColumnLeft.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {/* 中间列 - 稍微向下偏移 */}
            <div className="flex flex-col gap-3 pt-8">
              {reviewsColumnMiddle.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {/* 右列 */}
            <div className="flex flex-col gap-3">
              {reviewsColumnRight.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>

          {/* 底部渐变遮罩 */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 md:block"
            style={{ background: 'linear-gradient(to bottom, transparent, #f0eae1)' }}
          />
        </div>

        {/* 移动端：轮播 */}
        <div className="mt-8 md:hidden">
          <Carousel autoplay autoplayDelay={3000}>
            <CarouselContent className="-ml-4">
              {allReviews.map(review => (
                <CarouselSlide key={review.id} className="basis-[85%] pl-4">
                  <ReviewCard review={review} />
                </CarouselSlide>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* 底部按钮 - GitHub */}
        <div className="mt-8 flex justify-center">
          <a
            href="https://github.com/yikart/AiToEarn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Github className="size-4" />
            {t('reviews.viewOnGithub')}
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs">{starCount}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
