'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface MediaPreviewItem {
  type: 'image' | 'video'
  src: string
  title?: string
}

export interface MediaPreviewProps {
  open: boolean
  items: MediaPreviewItem[]
  initialIndex?: number
  onClose: () => void
}

export const MediaPreview = ({ open, items, initialIndex = 0, onClose }: MediaPreviewProps) => {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)))
    }
  }, [open, initialIndex, items.length])

  const hasMultiple = items.length > 1
  const current = items[index]

  const handlePrev = () => {
    if (!hasMultiple) return
    setIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const handleNext = () => {
    if (!hasMultiple) return
    setIndex((prev) => (prev + 1) % items.length)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          'border-none bg-transparent shadow-none p-0 max-w-[90vw] max-h-[90vh]',
          // 使用默认 overlay 做半透明背景，这里只负责居中内容
          '[&>button]:hidden flex items-center justify-center',
        )}
      >
        {/* 无障碍：为 Dialog 提供隐藏的标题和描述 */}
        <DialogTitle className="sr-only">Media preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of uploaded image or video.
        </DialogDescription>

        <div className="relative w-full flex items-center justify-center">
          {/* 内容卡片 */}
          <div className="relative max-h-[80vh] max-w-[90vw] overflow-hidden rounded-xl bg-background shadow-2xl">
            {/* 顶部关闭按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 媒体内容 */}
            <div className="flex items-center justify-center bg-muted/40">
              <AnimatePresence mode="wait">
                {current && (
                  <motion.div
                    key={`${current.src}-${index}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="max-h-[80vh] max-w-[90vw]"
                  >
                    {current.type === 'video' ? (
                      <video
                        src={current.src}
                        className="max-h-[80vh] max-w-[90vw] bg-black object-contain"
                        controls
                        autoPlay
                      />
                    ) : (
                      <img
                        src={current.src}
                        alt={current.title || 'preview'}
                        className="max-h-[80vh] max-w-[90vw] object-contain"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部索引 / 标题 */}
            <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t border-border/60 bg-background/80">
              {hasMultiple ? (
                <span>
                  {index + 1}/{items.length}
                </span>
              ) : (
                <span />
              )}
              {current?.title && (
                <span className="truncate max-w-[60%] text-right">{current.title}</span>
              )}
            </div>
          </div>

          {/* 左右切换按钮（悬浮在卡片两侧，半透明浅色） */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 md:left-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 md:right-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md hover:bg-background cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MediaPreview


