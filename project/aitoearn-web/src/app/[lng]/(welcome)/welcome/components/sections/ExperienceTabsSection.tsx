/**
 * ExperienceTabsSection - 体验标签轮播区块
 * 左侧文字 + 右侧视频布局
 */

'use client'

import type { ExperienceTab } from '../../data/experienceTabs'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AccountPlatInfoArr } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { cn } from '@/lib/utils'

import { experienceTabs } from '../../data/experienceTabs'
import styles from '../../styles/welcome.module.scss'
import {
  Carousel,
  CarouselContent,
  CarouselSlide,
  useCarousel,
} from '../ui/Carousel'

/** Tab 进度条 */
function TabProgress({ isActive, isPaused }: { isActive: boolean, isPaused: boolean }) {
  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full origin-left rounded-full bg-primary',
          styles.progressLine,
          isActive && !isPaused && styles.progressLineActive,
          isPaused && styles.progressLineStopped,
        )}
      />
    </div>
  )
}

/** Tab 菜单项 */
function TabMenuItem({
  tab,
  isActive,
  isPaused,
  onClick,
  t,
}: {
  tab: ExperienceTab
  isActive: boolean
  isPaused: boolean
  onClick: () => void
  t: (key: string) => string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 cursor-pointer flex-col items-start px-4 py-3 text-left transition-opacity md:px-6',
        !isActive && 'opacity-50 hover:opacity-75',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{tab.number}</span>
        <span className="text-base font-medium md:text-lg">{t(tab.titleKey)}</span>
      </div>
      <TabProgress isActive={isActive} isPaused={isPaused} />
    </button>
  )
}

/** Tab 内容区 - 左侧文字 + 右侧视频 */
function TabContent({
  tab,
  isActive,
  onVideoClick,
  t,
}: {
  tab: ExperienceTab
  isActive: boolean
  onVideoClick: (tab: ExperienceTab) => void
  t: (key: string) => string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // 当激活时播放视频，非激活时暂停
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }
      else {
        videoRef.current.pause()
      }
    }
  }, [isActive])

  return (
    <div className="grid grid-cols-1 gap-8 rounded-3xl bg-gradient-to-br from-muted/80 to-muted/40 p-8 md:grid-cols-2 md:gap-12 md:p-12">
      {/* 左侧文字 */}
      <div className="flex flex-col justify-center">
        <span className="text-sm font-medium uppercase tracking-wider text-primary">
          {t(tab.subtitleKey)}
        </span>
        <h3 className="mt-3 text-2xl font-bold md:text-4xl">
          {t(tab.titleKey)}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t(tab.descriptionKey)}
        </p>
        {tab.id === 'publish' && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {AccountPlatInfoArr.map(([platType, info]) => (
              <div key={platType} className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
                <Image src={info.icon} alt="" width={20} height={20} className="shrink-0" />
                <span className="text-sm font-medium truncate">{info.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧视频 - 可点击预览 */}
      <div
        className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-2xl"
        onClick={() => onVideoClick(tab)}
      >
        <video
          ref={videoRef}
          src={tab.video.url}
          poster={tab.video.poster}
          autoPlay
          muted
          loop
          playsInline
          className={cn(
            'size-full',
            tab.isVertical ? 'object-contain' : 'object-cover',
          )}
        />
        {/* 播放图标覆盖层 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="size-8 text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** 单个导航按钮 */
function CarouselNavButton({ direction, t }: { direction: 'prev' | 'next', t: (key: string) => string }) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()

  const isPrev = direction === 'prev'
  const Icon = isPrev ? ChevronLeft : ChevronRight
  const onClick = isPrev ? scrollPrev : scrollNext
  const disabled = isPrev ? !canScrollPrev : !canScrollNext
  const label = isPrev ? t('common.previous') : t('common.next')

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {isPrev && <Icon className="size-4" />}
      <span className="hidden text-muted-foreground md:inline">{label}</span>
      {!isPrev && <Icon className="size-4" />}
    </button>
  )
}

/** 内部轮播组件 - 用于访问 carousel context */
function ExperienceCarouselInner() {
  const { t } = useTransClient('welcome')
  const { emblaApi, selectedIndex } = useCarousel()
  const [isPaused, setIsPaused] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<MediaPreviewItem | null>(null)

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  const handleVideoClick = useCallback((tab: ExperienceTab) => {
    setPreviewVideo({
      type: 'video',
      src: tab.video.url,
      title: t(tab.titleKey),
    })
    setIsPaused(true)
  }, [t])

  const handleClosePreview = useCallback(() => {
    setPreviewVideo(null)
    setIsPaused(false)
  }, [])

  // 自动播放逻辑 - selectedIndex 变化时重置计时器
  useEffect(() => {
    if (!emblaApi || isPaused)
      return

    const autoplayInterval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      }
      else {
        emblaApi.scrollTo(0)
      }
    }, 7000) // 7秒切换

    return () => clearInterval(autoplayInterval)
  }, [emblaApi, isPaused, selectedIndex])

  return (
    <>
      {/* 标签菜单 - 桌面端 */}
      <div className="mb-8 hidden border-b border-border/50 md:flex">
        {experienceTabs.map((tab, index) => (
          <TabMenuItem
            key={tab.id}
            tab={tab}
            isActive={index === selectedIndex}
            isPaused={isPaused}
            onClick={() => scrollTo(index)}
            t={t}
          />
        ))}
      </div>

      {/* 内容轮播 */}
      <CarouselContent>
        {experienceTabs.map((tab, index) => (
          <CarouselSlide key={tab.id}>
            <TabContent
              tab={tab}
              isActive={index === selectedIndex}
              onVideoClick={handleVideoClick}
              t={t}
            />
          </CarouselSlide>
        ))}
      </CarouselContent>

      {/* 底部导航箭头 */}
      <div className="mt-6 flex items-center justify-between">
        <CarouselNavButton direction="prev" t={t} />
        <CarouselNavButton direction="next" t={t} />
      </div>

      {/* 视频预览弹窗 */}
      <MediaPreview
        open={!!previewVideo}
        items={previewVideo ? [previewVideo] : []}
        onClose={handleClosePreview}
      />
    </>
  )
}

export function ExperienceTabsSection() {
  const { t } = useTransClient('welcome')

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* 头部 */}
        <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold md:text-4xl">
          {t('experience.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground md:text-lg">
          {t('experience.subtitle')}
        </p>

        {/* 标签轮播 */}
        <div className="mt-12">
          <Carousel options={{ loop: true }}>
            <ExperienceCarouselInner />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
