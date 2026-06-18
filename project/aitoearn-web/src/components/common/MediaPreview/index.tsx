/**
 * MediaPreview - 媒体预览组件
 * 用于预览图片、视频和音频，支持多媒体轮播
 * 支持图片缩放、旋转、下载、画笔编辑，视频/音频播放
 */
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Minus,
  Music,
  Pencil,
  Plus,
  RotateCw,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getOssProxyPath } from '@/utils/oss'
import { BrushEditor } from './BrushEditor'

const MIN_SCALE = 0.25
const MAX_SCALE = 5
const ZOOM_BUTTON_STEP = 0.25
const WHEEL_ZOOM_SENSITIVITY = 0.002
const WHEEL_ZOOM_MAX_STEP = 0.18
const WHEEL_TRANSITION_DELAY = 120

interface PreviewPoint {
  x: number
  y: number
}

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

export interface MediaPreviewItem {
  type: 'image' | 'video' | 'audio'
  src: string
  title?: string
}

export interface MediaPreviewProps {
  open: boolean
  items: MediaPreviewItem[]
  initialIndex?: number
  onClose: () => void
  /** 是否启用编辑功能 */
  editable?: boolean
  /** 编辑完成回调，返回编辑后的图片 URL */
  onEdit?: (index: number, newUrl: string) => void
}

export function MediaPreview({
  open,
  items,
  initialIndex = 0,
  onClose,
  editable = false,
  onEdit,
}: MediaPreviewProps) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isWheelZooming, setIsWheelZooming] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaAreaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const scaleRef = useRef(scale)
  const positionRef = useRef(position)
  const wheelZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasMultiple = items.length > 1
  const current = items[index]
  const isImage = current?.type === 'image'
  const isAudio = current?.type === 'audio'

  const updateScaleState = useCallback((nextScale: number) => {
    scaleRef.current = nextScale
    setScale(nextScale)
  }, [])

  const updatePositionState = useCallback((nextPosition: PreviewPoint) => {
    positionRef.current = nextPosition
    setPosition(nextPosition)
  }, [])

  const getImageCenter = useCallback(() => {
    const image = imageRef.current
    if (!image)
      return null

    const rect = image.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }, [])

  const zoomToScale = useCallback(
    (nextScaleValue: number, anchorPoint?: PreviewPoint) => {
      const previousScale = scaleRef.current
      const nextScale = clampScale(nextScaleValue)

      if (nextScale === previousScale)
        return

      const previousPosition = positionRef.current
      let nextPosition = previousPosition

      if (nextScale <= 1) {
        nextPosition = { x: 0, y: 0 }
      }
      else {
        const imageCenter = getImageCenter()
        const anchor = anchorPoint ?? imageCenter

        if (anchor && imageCenter) {
          const scaleRatio = nextScale / previousScale
          nextPosition = {
            x: previousPosition.x + (anchor.x - imageCenter.x) * (1 - scaleRatio),
            y: previousPosition.y + (anchor.y - imageCenter.y) * (1 - scaleRatio),
          }
        }
      }

      updateScaleState(nextScale)
      updatePositionState(nextPosition)
    },
    [getImageCenter, updatePositionState, updateScaleState],
  )

  const markWheelZooming = useCallback(() => {
    setIsWheelZooming(true)

    if (wheelZoomTimeoutRef.current) {
      clearTimeout(wheelZoomTimeoutRef.current)
    }

    wheelZoomTimeoutRef.current = setTimeout(() => {
      setIsWheelZooming(false)
      wheelZoomTimeoutRef.current = null
    }, WHEEL_TRANSITION_DELAY)
  }, [])

  // 重置状态
  const resetState = useCallback(() => {
    updateScaleState(1)
    setRotate(0)
    updatePositionState({ x: 0, y: 0 })
    setLoading(true)
    setIsDragging(false)
  }, [updatePositionState, updateScaleState])

  const handlePrev = useCallback(() => {
    if (!hasMultiple)
      return
    setIndex(prev => (prev - 1 + items.length) % items.length)
  }, [hasMultiple, items.length])

  const handleNext = useCallback(() => {
    if (!hasMultiple)
      return
    setIndex(prev => (prev + 1) % items.length)
  }, [hasMultiple, items.length])

  const handleZoomIn = useCallback(() => zoomToScale(scaleRef.current + ZOOM_BUTTON_STEP), [zoomToScale])
  const handleZoomOut = useCallback(() => zoomToScale(scaleRef.current - ZOOM_BUTTON_STEP), [zoomToScale])

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)))
      resetState()
      document.body.style.overflow = 'hidden'
    }
    else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, initialIndex, items.length, resetState])

  useEffect(() => {
    resetState()
  }, [index, resetState])

  useEffect(() => {
    return () => {
      if (wheelZoomTimeoutRef.current) {
        clearTimeout(wheelZoomTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open || !isImage)
      return

    const mediaArea = mediaAreaRef.current
    if (!mediaArea)
      return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      markWheelZooming()

      const scaleStep = Math.min(
        WHEEL_ZOOM_MAX_STEP,
        Math.max(-WHEEL_ZOOM_MAX_STEP, -event.deltaY * WHEEL_ZOOM_SENSITIVITY),
      )
      const zoomFactor = 1 + scaleStep

      zoomToScale(scaleRef.current * zoomFactor, {
        x: event.clientX,
        y: event.clientY,
      })
    }

    mediaArea.addEventListener('wheel', handleWheel, { passive: false })
    return () => mediaArea.removeEventListener('wheel', handleWheel)
  }, [isImage, markWheelZooming, open, zoomToScale])

  useEffect(() => {
    if (!open)
      return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          e.stopPropagation()
          handlePrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          e.stopPropagation()
          handleNext()
          break
        case '+':
        case '=':
          e.preventDefault()
          e.stopPropagation()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          e.stopPropagation()
          handleZoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut])

  const handleRotate = () => setRotate(r => r + 90)

  /** 打开编辑器 */
  const handleOpenEditor = useCallback(() => {
    setIsEditorOpen(true)
  }, [])

  /** 编辑保存回调 */
  const handleEditorSave = useCallback(
    (newUrl: string) => {
      onEdit?.(index, newUrl)
      setIsEditorOpen(false)
    },
    [index, onEdit],
  )

  const handleDownload = () => {
    if (!current?.src)
      return
    const url = getOssProxyPath(current.src)
    const link = document.createElement('a')
    link.href = url
    link.download = url.split('/').pop() || 'media'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isImage || scaleRef.current <= 1)
      return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging)
        return
      updatePositionState({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    },
    [isDragging, updatePositionState],
  )

  const handleMouseUp = () => setIsDragging(false)

  const handleDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isImage)
      return
    if (scaleRef.current <= 1) {
      zoomToScale(2, { x: e.clientX, y: e.clientY })
    }
    else {
      zoomToScale(1)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // SSR 检查
  if (typeof window === 'undefined')
    return null

  const portalContent = createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={handleBackdropClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ref={containerRef}
        >
          {/* 顶部工具栏 */}
          <div
            className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="下载"
              >
                <Download size={20} />
              </button>

              {isImage && (
                <>
                  <div className="w-px h-5 bg-white/20 mx-2" />

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="放大"
                  >
                    <Plus size={20} />
                  </button>

                  <span className="text-white/80 text-sm min-w-[60px] text-center select-none">
                    {Math.round(scale * 100)}
                    %
                  </span>

                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="缩小"
                  >
                    <Minus size={20} />
                  </button>

                  <div className="w-px h-5 bg-white/20 mx-2" />

                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="旋转"
                  >
                    <RotateCw size={20} />
                  </button>

                  {/* 编辑按钮 */}
                  {editable && onEdit && (
                    <>
                      <div className="w-px h-5 bg-white/20 mx-2" />
                      <button
                        type="button"
                        onClick={handleOpenEditor}
                        className="flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="编辑"
                      >
                        <Pencil size={20} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="关闭"
            >
              <X size={24} />
            </button>
          </div>

          {/* 媒体内容区域 */}
          <div
            className="relative flex items-center justify-center w-full h-full pt-14 pb-12"
            onClick={handleBackdropClick}
            ref={mediaAreaRef}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.src}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center"
                style={{ maxWidth: '90vw', maxHeight: 'calc(100vh - 120px)' }}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                  </div>
                )}

                {isImage ? (
                  <img
                    ref={imageRef}
                    src={current.src}
                    alt={current.title || 'preview'}
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={handleDoubleClick}
                    draggable={false}
                    className="select-none"
                    style={{
                      maxWidth: '90vw',
                      maxHeight: 'calc(100vh - 120px)',
                      objectFit: 'contain',
                      transform: `translate(${position.x}px, ${position.y}px) rotate(${rotate}deg) scale(${scale})`,
                      transformOrigin: 'center center',
                      transition: isDragging || isWheelZooming ? 'none' : 'transform 0.15s ease-out',
                      cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      opacity: loading ? 0 : 1,
                    }}
                  />
                ) : isAudio ? (
                  <div className="flex w-[min(90vw,420px)] max-w-[90vw] flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Music size={28} />
                    </div>
                    {current.title && (
                      <div className="max-w-full truncate text-sm font-medium">
                        {current.title}
                      </div>
                    )}
                    <audio
                      src={current.src}
                      controls
                      autoPlay
                      preload="metadata"
                      onLoadedMetadata={() => setLoading(false)}
                      onCanPlay={() => setLoading(false)}
                      onError={() => setLoading(false)}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <video
                    src={current.src}
                    controls
                    autoPlay
                    onLoadedData={() => setLoading(false)}
                    onError={() => setLoading(false)}
                    className="select-none"
                    style={{
                      maxWidth: '90vw',
                      maxHeight: 'calc(100vh - 120px)',
                      objectFit: 'contain',
                      opacity: loading ? 0 : 1,
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 左右切换按钮 */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
                title="上一个"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
                title="下一个"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* 底部页码指示器 */}
          {hasMultiple && (
            <div
              className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center z-10"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
              <div className="flex items-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      i === index ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
              <span className="absolute right-4 text-white/60 text-sm">
                {index + 1}
                {' '}
                /
                {items.length}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )

  return (
    <>
      {portalContent}

      {/* 画笔编辑器 */}
      {editable && isImage && current && (
        <BrushEditor
          open={isEditorOpen}
          imageUrl={current.src}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleEditorSave}
        />
      )}
    </>
  )
}

export default MediaPreview
