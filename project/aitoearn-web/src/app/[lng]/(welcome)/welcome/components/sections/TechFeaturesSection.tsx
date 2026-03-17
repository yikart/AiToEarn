/**
 * TechFeaturesSection - AI 视频展示区块
 * 展示 AI 生成的探店视频
 * - 桌面端：三列等宽布局
 * - 移动端：轮播展示
 */

'use client'

import type { AIVideoItem } from '../../data/techFeatures'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { Pause, Play } from 'lucide-react'
import Image from 'next/image'

import { useCallback, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { MediaPreview } from '@/components/common/MediaPreview'
import { cn } from '@/lib/utils'

import { aiVideoShowcase } from '../../data/techFeatures'
import { Carousel, CarouselContent, CarouselSlide } from '../ui/Carousel'

/** 最大播放时长（秒） */
const MAX_PLAY_DURATION = 15

/** 视频卡片 */
function VideoCard({
  video,
  t,
  onPreviewClick,
}: {
  video: AIVideoItem
  t: (key: string) => string
  onPreviewClick: (video: AIVideoItem) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  /** 切换播放/暂停 */
  const handleTogglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
      else {
        videoRef.current.currentTime = 0
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
      }
    }
  }, [isPlaying])

  /** 视频播放结束或达到时长限制 */
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [])

  /** 监听播放进度，超过最大时长自动停止 */
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && videoRef.current.currentTime >= MAX_PLAY_DURATION) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  return (
    <div
      className="group relative aspect-[9/16] max-h-[500px] cursor-pointer overflow-hidden rounded-3xl bg-muted shadow-lg"
      onClick={() => onPreviewClick(video)}
    >
      {/* 封面图 - 播放时隐藏 */}
      <Image
        src={video.cover}
        alt={t(video.titleKey)}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        className={cn(
          'object-cover transition-opacity duration-300',
          isPlaying && 'opacity-0',
        )}
      />

      {/* 视频层 */}
      <video
        ref={videoRef}
        src={video.video}
        poster={video.cover}
        muted
        playsInline
        className="size-full object-cover"
        onEnded={handleVideoEnded}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* 渐变遮罩 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* 标题 */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-lg font-semibold text-white md:text-xl">
          {t(video.titleKey)}
        </h3>
      </div>

      {/* 播放/暂停按钮 - 始终可见 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleTogglePlay()
        }}
        className={cn(
          'absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:scale-110',
          isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
        )}
      >
        {isPlaying
          ? <Pause className="size-7 text-foreground" />
          : <Play className="ml-1 size-7 text-foreground" />}
      </button>
    </div>
  )
}

export function TechFeaturesSection() {
  const { t } = useTransClient('welcome')
  const [previewVideo, setPreviewVideo] = useState<MediaPreviewItem | null>(null)

  const handlePreviewClick = useCallback((video: AIVideoItem) => {
    setPreviewVideo({
      type: 'video',
      src: video.video,
      title: t(video.titleKey),
    })
  }, [t])

  const handleClosePreview = useCallback(() => {
    setPreviewVideo(null)
  }, [])

  return (
    <section className="-mt-6 rounded-tl-3xl rounded-tr-3xl bg-white py-16 md:-mt-8 md:py-24 lg:mx-2">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* 头部 */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold md:text-4xl">
            {t('tech.title')}
          </h2>
          <p className="mt-3 text-lg text-primary md:text-xl">
            {t('tech.subtitle')}
          </p>
        </div>

        {/* 桌面端：三列视频网格 */}
        <div className="mx-auto mt-12 hidden max-w-4xl gap-6 sm:grid sm:grid-cols-3">
          {aiVideoShowcase.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              t={t}
              onPreviewClick={handlePreviewClick}
            />
          ))}
        </div>

        {/* 移动端：轮播 */}
        <div className="mt-10 sm:hidden">
          <Carousel autoplay autoplayDelay={4000}>
            <CarouselContent className="-ml-4">
              {aiVideoShowcase.map(video => (
                <CarouselSlide key={video.id} className="basis-[75%] pl-4">
                  <VideoCard
                    video={video}
                    t={t}
                    onPreviewClick={handlePreviewClick}
                  />
                </CarouselSlide>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* 底部描述 */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground md:text-lg">
          {t('tech.description')}
        </p>
      </div>

      {/* 视频预览弹窗 */}
      <MediaPreview
        open={!!previewVideo}
        items={previewVideo ? [previewVideo] : []}
        onClose={handleClosePreview}
      />
    </section>
  )
}
