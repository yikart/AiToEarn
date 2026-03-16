/**
 * Carousel - Embla 轮播组件封装
 * 公共组件，基于 embla-carousel-react
 */

'use client'

import type { UseEmblaCarouselType } from 'embla-carousel-react'
import type { ReactNode } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type EmblaCarouselType = UseEmblaCarouselType[1]
type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0]

interface CarouselContextValue {
  emblaRef: (node: HTMLElement | null) => void
  emblaApi: EmblaCarouselType | undefined
  selectedIndex: number
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

export function useCarousel() {
  const context = useContext(CarouselContext)
  if (!context) {
    throw new Error('useCarousel must be used within a Carousel')
  }
  return context
}

interface CarouselProps {
  children: ReactNode
  options?: EmblaOptionsType
  autoplay?: boolean
  autoplayDelay?: number
  className?: string
  /** 当 slide 变化时回调 */
  onSlideChange?: (index: number) => void
}

export function Carousel({
  children,
  options,
  autoplay = false,
  autoplayDelay = 5000,
  className,
  onSlideChange,
}: CarouselProps) {
  const plugins = autoplay
    ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
    : []

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, ...options },
    plugins,
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi)
      return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    onSlideChange?.(index)
  }, [emblaApi, onSlideChange])

  useEffect(() => {
    if (!emblaApi)
      return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        emblaRef,
        emblaApi,
        selectedIndex,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div className={cn('relative', className)}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

interface CarouselContentProps {
  children: ReactNode
  className?: string
}

export function CarouselContent({ children, className }: CarouselContentProps) {
  const { emblaRef } = useCarousel()

  return (
    <div ref={emblaRef} className="overflow-hidden">
      <div className={cn('flex', className)}>
        {children}
      </div>
    </div>
  )
}

interface CarouselSlideProps {
  children: ReactNode
  className?: string
}

export function CarouselSlide({ children, className }: CarouselSlideProps) {
  return (
    <div className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}>
      {children}
    </div>
  )
}

interface CarouselArrowsProps {
  className?: string
  prevClassName?: string
  nextClassName?: string
  showLabels?: boolean
  labels?: {
    previous: string
    next: string
  }
}

export function CarouselArrows({
  className,
  prevClassName,
  nextClassName,
  showLabels = false,
  labels = { previous: 'Previous', next: 'Next' },
}: CarouselArrowsProps) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className={cn(
          'flex items-center gap-2 rounded-full p-2 transition-opacity hover:opacity-70 disabled:opacity-30',
          prevClassName,
        )}
      >
        <ChevronLeft className="size-5" />
        {showLabels && (
          <span className="hidden text-sm text-muted-foreground md:inline">
            {labels.previous}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        className={cn(
          'flex items-center gap-2 rounded-full p-2 transition-opacity hover:opacity-70 disabled:opacity-30',
          nextClassName,
        )}
      >
        {showLabels && (
          <span className="hidden text-sm text-muted-foreground md:inline">
            {labels.next}
          </span>
        )}
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

interface CarouselDotsProps {
  className?: string
  dotClassName?: string
  activeDotClassName?: string
}

export function CarouselDots({
  className,
  dotClassName,
  activeDotClassName,
}: CarouselDotsProps) {
  const { emblaApi, selectedIndex } = useCarousel()
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  useEffect(() => {
    if (!emblaApi)
      return
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [emblaApi])

  return (
    <div className={cn('flex justify-center gap-2', className)}>
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => emblaApi?.scrollTo(index)}
          className={cn(
            'size-2 rounded-full bg-current opacity-30 transition-opacity',
            dotClassName,
            index === selectedIndex && cn('opacity-100', activeDotClassName),
          )}
        />
      ))}
    </div>
  )
}
