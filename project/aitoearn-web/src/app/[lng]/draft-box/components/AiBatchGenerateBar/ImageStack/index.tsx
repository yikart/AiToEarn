/**
 * ImageStack - 图片/视频堆叠组件
 * 折叠态：卡牌堆叠（大旋转角度、竖长方形 3:4 比例），右下角 "+" 按钮
 * 展开态（hover）：纯 transform 驱动平滑水平排列，hover 显示 X 删除按钮
 * 移动端：flex-wrap 网格布局，始终展开，X 按钮始终显示
 */

'use client'

import type { VideoModelType } from '@/api/draftGeneration'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { Loader2, Play, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MediaPreview } from '@/components/common/MediaPreview'
import { cn } from '@/lib/utils'
import { formatVideoDuration, getVideoInfo } from '@/utils/media'
import { getOssUrl } from '@/utils/oss'
import AddMediaButton from '../AddMediaButton'
import styles from './ImageStack.module.scss'

interface ImageStackProps {
  images: any[]
  allImages: any[]
  selectedIds: string[]
  maxImages: number
  onImagesChange: (ids: string[]) => void
  localMedias: IUploadedMedia[]
  onLocalMediaRemove: (index: number) => void
  onLocalUpload: (files: FileList) => void
  modelType: VideoModelType
  canUploadImage: boolean
  canUploadVideo: boolean
  videoHintText?: string
  /** 本地已上传的图片数量，用于联动计算总配额 */
  localImageCount: number
}

/** 折叠态图片尺寸（竖长方形，约 3:4 比例） */
const ITEM_WIDTH = 50
const ITEM_HEIGHT = 66

/** 展开态布局参数 */
const EXPAND_GAP = 6

/** 折叠态旋转角度 — 更大、更有层次 */
const STACK_ROTATIONS = [12, -6, 22, -10, 8]

/** 展开态旋转角度 — 比折叠态小，保持层次感 */
const EXPAND_ROTATIONS = [6, -4, 10, -5, 4]

const ImageStack = memo(({
  images,
  allImages,
  selectedIds,
  maxImages,
  onImagesChange,
  localMedias,
  onLocalMediaRemove,
  onLocalUpload,
  modelType,
  canUploadImage,
  canUploadVideo,
  videoHintText,
  localImageCount,
}: ImageStackProps) => {
  const [expanded, setExpanded] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [hoveredVideoIndex, setHoveredVideoIndex] = useState<number | null>(null)
  const hoverRef = useRef(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 媒体预览
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])

  // Exit 动画状态
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set())
  const exitTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const localMediasRef = useRef(localMedias)
  localMediasRef.current = localMedias

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }, [])

  useEffect(() => () => {
    clearCollapseTimer()
    exitTimeoutsRef.current.forEach(t => clearTimeout(t))
  }, [clearCollapseTimer])

  // 移动端检测（640px 断点）
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleDeleteImage = useCallback((e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    if (exitingKeys.has(imageId))
      return
    setExitingKeys(prev => new Set(prev).add(imageId))
    const timer = setTimeout(() => {
      onImagesChange(selectedIdsRef.current.filter(id => id !== imageId))
      setExitingKeys((prev) => { const n = new Set(prev); n.delete(imageId); return n })
      exitTimeoutsRef.current.delete(timer)
    }, 300)
    exitTimeoutsRef.current.add(timer)
  }, [onImagesChange, exitingKeys])

  const handleDeleteLocalMedia = useCallback((e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation()
    if (exitingKeys.has(`local-${mediaId}`))
      return
    setExitingKeys(prev => new Set(prev).add(`local-${mediaId}`))
    const timer = setTimeout(() => {
      const idx = localMediasRef.current.findIndex(m => m.id === mediaId)
      if (idx >= 0)
        onLocalMediaRemove(idx)
      setExitingKeys((prev) => { const n = new Set(prev); n.delete(`local-${mediaId}`); return n })
      exitTimeoutsRef.current.delete(timer)
    }, 300)
    exitTimeoutsRef.current.add(timer)
  }, [onLocalMediaRemove, exitingKeys])

  // 总项目数（店铺图片 + 本地媒体）
  const totalMediaCount = images.length + localMedias.length

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setPopoverOpen(open)
    if (!open && !hoverRef.current && totalMediaCount > 0) {
      clearCollapseTimer()
      collapseTimerRef.current = setTimeout(() => setExpanded(false), 300)
    }
  }, [clearCollapseTimer, totalMediaCount])

  // 选满后主动重置 popover 和折叠状态
  useEffect(() => {
    if (images.length + localImageCount >= maxImages && popoverOpen) {
      setPopoverOpen(false)
      if (!hoverRef.current) {
        clearCollapseTimer()
        collapseTimerRef.current = setTimeout(() => setExpanded(false), 300)
      }
    }
  }, [images.length, localImageCount, maxImages, popoverOpen, clearCollapseTimer])

  // 展开态容器尺寸（动态计算）
  const expandedContainerStyle = useMemo(() => {
    const hasAddButton = canUploadImage || canUploadVideo || images.length < maxImages
    const totalItems = totalMediaCount + (hasAddButton ? 1 : 0)
    if (totalItems === 0) {
      return { width: ITEM_WIDTH, height: ITEM_HEIGHT + 10 }
    }
    return {
      width: totalItems * ITEM_WIDTH + (totalItems - 1) * EXPAND_GAP,
      height: Math.max(ITEM_HEIGHT, 70) + 10,
    }
  }, [totalMediaCount, maxImages, images.length, canUploadImage, canUploadVideo])

  // 居中计算：折叠态/空状态下内容区域在 80px 父容器内居中
  const PARENT_WIDTH = 80 // w-20
  const containerLeft = useMemo(() => {
    return (PARENT_WIDTH - ITEM_WIDTH) / 2
  }, [])

  const handleMediaClick = useCallback((url: string, type: 'image' | 'video') => {
    setPreviewItems([{ type, src: url }])
    setPreviewOpen(true)
  }, [])

  // "+" 按钮是否显示
  const showAddButton = canUploadImage || canUploadVideo || images.length < maxImages

  // 视频信息 Map<mediaId, { coverUrl, duration }>
  const [videoInfoMap, setVideoInfoMap] = useState<Map<string, { coverUrl: string, duration: number }>>(new Map())
  const processingIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    localMedias.forEach((media) => {
      if (media.type === 'video' && media.id && media.file
        && !videoInfoMap.has(media.id) && !processingIdsRef.current.has(media.id)) {
        processingIdsRef.current.add(media.id)
        getVideoInfo(media.file).then((info) => {
          setVideoInfoMap(prev => new Map(prev).set(media.id!, info))
        }).catch(() => {
          processingIdsRef.current.delete(media.id!)
        })
      }
    })
  }, [localMedias, videoInfoMap])

  // 桌面端空状态自动展开，使 "+" 显示为卡片；首次加载完成后自动折叠
  const prevTotalMediaCountRef = useRef(0)
  useEffect(() => {
    if (!isMobile) {
      if (totalMediaCount === 0) {
        setExpanded(true)
      }
      else if (prevTotalMediaCountRef.current === 0 && totalMediaCount > 0) {
        // 从空到有媒体（初始加载），折叠回去
        setExpanded(false)
      }
    }
    prevTotalMediaCountRef.current = totalMediaCount
  }, [totalMediaCount, isMobile])

  // 移动端：flex-wrap 网格，始终展开
  if (isMobile) {
    return (
      <>
        <div data-testid="draftbox-ai-image-stack" className={styles.mobileGrid}>
          {/* 店铺图片 */}
          {images.map((image, index) => {
            const rotation = EXPAND_ROTATIONS[index % EXPAND_ROTATIONS.length]
            const isExiting = exitingKeys.has(image.id)
            return (
              <div
                key={image.id}
                className={cn(styles.mobileGridItem, isExiting && styles.imageItemExiting)}
                style={{ '--expand-rotation': `${rotation}deg`, 'transform': `rotate(${rotation}deg)` } as React.CSSProperties}
                onClick={() => handleMediaClick(getOssUrl(image.url), 'image')}
              >
                <div className="relative w-full h-full overflow-hidden rounded-md cursor-pointer">
                  <Image src={getOssUrl(image.url)} alt="" fill className="object-cover" sizes="50px" />
                </div>
                <button
                  type="button"
                  className={styles.mobileDeleteButton}
                  onClick={e => handleDeleteImage(e, image.id)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )
          })}
          {/* 本地媒体 */}
          {localMedias.map((media, index) => {
            const rotation = EXPAND_ROTATIONS[(images.length + index) % EXPAND_ROTATIONS.length]
            const isVideo = media.type === 'video'
            const isUploading = media.progress !== undefined
            const previewSrc = media.url || (media.file ? URL.createObjectURL(media.file) : '')
            const isExiting = exitingKeys.has(`local-${media.id}`)
            return (
              <div
                key={media.id || index}
                className={cn(styles.mobileGridItem, isExiting && styles.imageItemExiting, isVideo && 'group/video')}
                style={{ '--expand-rotation': `${rotation}deg`, 'transform': `rotate(${rotation}deg)` } as React.CSSProperties}
                onClick={() => !isUploading && media.url && handleMediaClick(media.url, isVideo ? 'video' : 'image')}
              >
                <div className="relative w-full h-full overflow-hidden rounded-md cursor-pointer">
                  {isVideo
                    ? (
                        <div className="w-full h-full relative">
                          {videoInfoMap.get(media.id!)?.coverUrl
                            ? <Image src={videoInfoMap.get(media.id!)!.coverUrl} alt="" fill className="object-cover" sizes="50px" unoptimized />
                            : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Play className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                          {videoInfoMap.get(media.id!)?.duration != null && (
                            <span className={styles.durationBadge}>
                              {formatVideoDuration(videoInfoMap.get(media.id!)!.duration)}
                            </span>
                          )}
                        </div>
                      )
                    : previewSrc
                      ? <Image src={previewSrc} alt="" fill className="object-cover" sizes="50px" unoptimized={!media.url} />
                      : <div className="w-full h-full bg-muted" />}
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      {typeof media.progress === 'number' && media.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-md">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${media.progress}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isVideo && videoHintText && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none whitespace-nowrap z-50 bg-primary text-primary-foreground text-xs rounded-md px-2 py-1 transition-opacity duration-150 group-hover/video:opacity-100">
                    {videoHintText}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.mobileDeleteButton}
                  onClick={e => handleDeleteLocalMedia(e, media.id!)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )
          })}
          {showAddButton && (
            <AddMediaButton
              allImages={allImages}
              selectedIds={selectedIds}
              maxImages={maxImages}
              onImagesChange={onImagesChange}
              onLocalUpload={onLocalUpload}
              canUploadImage={canUploadImage}
              canUploadVideo={canUploadVideo}
              localImageCount={localImageCount}
              isMobile
            >
              <button data-testid="draftbox-ai-add-media-btn" type="button" className={styles.mobileAddButton}>
                <Plus className="h-4 w-4" />
              </button>
            </AddMediaButton>
          )}
        </div>
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          onClose={() => setPreviewOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <div data-testid="draftbox-ai-image-stack" className="flex items-start gap-1">
        {/* 固定占位容器 — 比图片稍大以容纳旋转溢出 */}
        <div className="relative w-20 h-24 flex-shrink-0">
          {/* 展开态悬浮容器 — hover 区域 = 图片容器 */}
          <div
            className={cn(styles.expandContainer, expanded && styles.expanded)}
            style={expanded
              ? { ...expandedContainerStyle, left: containerLeft }
              : { width: ITEM_WIDTH, height: ITEM_HEIGHT, left: containerLeft }}
            onMouseEnter={() => {
              hoverRef.current = true
              clearCollapseTimer()
            }}
            onMouseLeave={() => {
              hoverRef.current = false
              setHoveredVideoIndex(null)
              if (!popoverOpen && totalMediaCount > 0) {
                clearCollapseTimer()
                collapseTimerRef.current = setTimeout(() => setExpanded(false), 300)
              }
            }}
          >
            {/* 店铺图片 */}
            {images.map((image, index) => {
              const rotation = STACK_ROTATIONS[index % STACK_ROTATIONS.length]
              const expandRotation = EXPAND_ROTATIONS[index % EXPAND_ROTATIONS.length]
              const isExiting = exitingKeys.has(image.id)
              return (
                <div
                  key={image.id}
                  className={cn(styles.imageItem, expanded && styles.imageItemExpanded, isExiting && styles.imageItemExiting)}
                  style={expanded
                    ? {
                        '--expand-x': `${index * (ITEM_WIDTH + EXPAND_GAP)}px`,
                        '--expand-rotation': `${expandRotation}deg`,
                        '--stack-z': index,
                      } as React.CSSProperties
                    : {
                        transform: `rotate(${rotation}deg)`,
                        zIndex: index,
                        opacity: index >= totalMediaCount - 5 ? 1 : 0,
                        pointerEvents: (index >= totalMediaCount - 5 ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
                      }}
                  onMouseEnter={() => {
                    if (!expanded)
                      setExpanded(true)
                    setHoveredVideoIndex(null)
                  }}
                  onClick={() => expanded && handleMediaClick(getOssUrl(image.url), 'image')}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-md cursor-pointer">
                    <Image src={getOssUrl(image.url)} alt="" fill className="object-cover" sizes="50px" />
                  </div>
                  {expanded && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={e => handleDeleteImage(e, image.id)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )
            })}
            {/* 本地媒体（图片 + 视频） */}
            {localMedias.map((media, index) => {
              const globalIndex = images.length + index
              const rotation = STACK_ROTATIONS[globalIndex % STACK_ROTATIONS.length]
              const expandRotation = EXPAND_ROTATIONS[globalIndex % EXPAND_ROTATIONS.length]
              const isVideo = media.type === 'video'
              const isUploading = media.progress !== undefined
              const previewSrc = media.url || (media.file ? URL.createObjectURL(media.file) : '')
              const isExiting = exitingKeys.has(`local-${media.id}`)
              return (
                <div
                  key={media.id || `local-${index}`}
                  className={cn(styles.imageItem, expanded && styles.imageItemExpanded, isExiting && styles.imageItemExiting, isVideo && 'group/video')}
                  style={expanded
                    ? {
                        '--expand-x': `${globalIndex * (ITEM_WIDTH + EXPAND_GAP)}px`,
                        '--expand-rotation': `${expandRotation}deg`,
                        '--stack-z': globalIndex,
                      } as React.CSSProperties
                    : {
                        transform: `rotate(${rotation}deg)`,
                        zIndex: globalIndex,
                        opacity: globalIndex >= totalMediaCount - 5 ? 1 : 0,
                        pointerEvents: (globalIndex >= totalMediaCount - 5 ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
                      }}
                  onMouseEnter={() => {
                    if (!expanded)
                      setExpanded(true)
                    if (isVideo)
                      setHoveredVideoIndex(globalIndex)
                    else setHoveredVideoIndex(null)
                  }}
                  onMouseLeave={() => {
                    if (isVideo)
                      setHoveredVideoIndex(null)
                  }}
                  onClick={() => expanded && !isUploading && media.url && handleMediaClick(media.url, isVideo ? 'video' : 'image')}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-md cursor-pointer">
                    {isVideo
                      ? (
                          <div className="w-full h-full relative">
                            {videoInfoMap.get(media.id!)?.coverUrl
                              ? <Image src={videoInfoMap.get(media.id!)!.coverUrl} alt="" fill className="object-cover" sizes="50px" unoptimized />
                              : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center cursor-pointer">
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                            {videoInfoMap.get(media.id!)?.duration != null && (
                              <span className={styles.durationBadge}>
                                {formatVideoDuration(videoInfoMap.get(media.id!)!.duration)}
                              </span>
                            )}
                          </div>
                        )
                      : previewSrc
                        ? <Image src={previewSrc} alt="" fill className="object-cover" sizes="50px" unoptimized={!media.url} />
                        : <div className="w-full h-full bg-muted" />}
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        {typeof media.progress === 'number' && media.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-md">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${media.progress}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {expanded && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={e => handleDeleteLocalMedia(e, media.id!)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              )
            })}
            {/* 视频气泡提示 — 渲染在 expandContainer 内，脱离旋转 GPU 图层 */}
            {expanded && hoveredVideoIndex !== null && videoHintText && (
              <div
                className="absolute pointer-events-none whitespace-nowrap z-[60] bg-primary text-primary-foreground text-xs rounded-md px-2 py-1"
                style={{
                  top: -32,
                  left: hoveredVideoIndex * (ITEM_WIDTH + EXPAND_GAP) + ITEM_WIDTH / 2,
                  transform: 'translateX(-50%)',
                }}
              >
                {videoHintText}
              </div>
            )}
            {/* "+" 按钮 — 始终渲染，CSS 过渡折叠/展开 */}
            {showAddButton && (
              <div
                className={cn(
                  styles.addButtonWrapper,
                  expanded ? styles.addButtonWrapperExpanded : styles.addButtonWrapperCollapsed,
                )}
                style={expanded
                  ? { '--expand-x': `${totalMediaCount * (ITEM_WIDTH + EXPAND_GAP)}px` } as React.CSSProperties
                  : undefined}
              >
                <AddMediaButton
                  allImages={allImages}
                  selectedIds={selectedIds}
                  maxImages={maxImages}
                  onImagesChange={onImagesChange}
                  onLocalUpload={onLocalUpload}
                  onPopoverOpenChange={handlePopoverOpenChange}
                  canUploadImage={canUploadImage}
                  canUploadVideo={canUploadVideo}
                  localImageCount={localImageCount}
                >
                  <button data-testid="draftbox-ai-add-media-btn" type="button" className={expanded ? styles.addButtonExpanded : styles.addButtonCollapsed}>
                    <Plus className={expanded ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
                  </button>
                </AddMediaButton>
              </div>
            )}
          </div>
        </div>
      </div>
      <MediaPreview
        open={previewOpen}
        items={previewItems}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
})

ImageStack.displayName = 'ImageStack'

export default ImageStack
