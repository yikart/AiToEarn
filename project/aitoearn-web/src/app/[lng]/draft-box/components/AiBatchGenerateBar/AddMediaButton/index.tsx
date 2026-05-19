/**
 * AddMediaButton - 添加媒体按钮
 * hover 显示菜单（选择店铺图片 / 本地上传），点击默认打开店铺图片选择
 */

'use client'

import type { BrandImage } from '../index'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageIcon, Upload } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import ImageSelectorPopover from '../ImageSelectorPopover'
import styles from './AddMediaButton.module.scss'

const MENU_OFFSET = 4
const VIEWPORT_PADDING = 8
const MENU_TRANSITION = { duration: 0.16, ease: 'easeOut' } as const

interface MenuPosition {
  top: number
  left: number
}

interface AddMediaButtonProps {
  allImages: BrandImage[]
  selectedIds: string[]
  maxImages: number
  onImagesChange: (ids: string[]) => void
  onLocalUpload: (files: FileList) => void
  onPopoverOpenChange?: (open: boolean) => void
  canUploadImage: boolean
  canUploadVideo: boolean
  /** 本地已上传的图片数量，用于联动计算总配额 */
  localImageCount?: number
  children: React.ReactNode
  className?: string
  /** 使用 absolute 定位（如折叠态按钮），避免 SCSS position:relative 覆盖 Tailwind */
  wrapperAbsolute?: boolean
  /** 移动端模式：点击切换菜单，禁用 hover */
  isMobile?: boolean
}

const AddMediaButton = memo(({
  allImages,
  selectedIds,
  maxImages,
  onImagesChange,
  onLocalUpload,
  onPopoverOpenChange,
  canUploadImage,
  canUploadVideo,
  localImageCount,
  children,
  className,
  wrapperAbsolute,
  isMobile,
}: AddMediaButtonProps) => {
  const { t } = useTransClient('brandPromotion')
  const [hoverMenuVisible, setHoverMenuVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const updateMenuPosition = useCallback(() => {
    const wrapper = wrapperRef.current
    const menu = menuRef.current

    if (!wrapper || !menu) {
      return
    }

    const wrapperRect = wrapper.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const left = Math.min(
      Math.max(VIEWPORT_PADDING, wrapperRect.left),
      Math.max(VIEWPORT_PADDING, viewportWidth - menuRect.width - VIEWPORT_PADDING),
    )

    const topAbove = wrapperRect.top - menuRect.height - MENU_OFFSET
    const topBelow = wrapperRect.bottom + MENU_OFFSET
    const canOpenBelow = topBelow + menuRect.height <= viewportHeight - VIEWPORT_PADDING

    const top = Math.min(
      Math.max(
        VIEWPORT_PADDING,
        topAbove >= VIEWPORT_PADDING || !canOpenBelow ? topAbove : topBelow,
      ),
      Math.max(VIEWPORT_PADDING, viewportHeight - menuRect.height - VIEWPORT_PADDING),
    )

    setMenuPosition({ top, left })
  }, [])

  useEffect(() => {
    if (!hoverMenuVisible || !isMounted) {
      return
    }

    updateMenuPosition()

    const handleReposition = () => updateMenuPosition()

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [hoverMenuVisible, isMounted, updateMenuPosition])

  const handleMouseEnter = useCallback(() => {
    if (popoverOpen)
      return
    clearHoverTimer()
    setHoverMenuVisible(true)
  }, [clearHoverTimer, popoverOpen])

  const handleMouseLeave = useCallback(() => {
    clearHoverTimer()
    hoverTimerRef.current = setTimeout(() => setHoverMenuVisible(false), 150)
  }, [clearHoverTimer])

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setPopoverOpen(false)
      setHoverMenuVisible(false)
      onPopoverOpenChange?.(false)
    }
  }, [onPopoverOpenChange])

  const handleSelectStoreImages = useCallback(() => {
    setPopoverOpen(true)
    setHoverMenuVisible(false)
    onPopoverOpenChange?.(true)
  }, [onPopoverOpenChange])

  const handleLocalUploadClick = useCallback(() => {
    setHoverMenuVisible(false)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onLocalUpload(files)
    }
    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }, [onLocalUpload])

  // 移动端：点击切换菜单；桌面端：点击本地上传
  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (isMobile) {
      setHoverMenuVisible(prev => !prev)
    }
    else {
      handleLocalUploadClick()
    }
  }, [isMobile, handleLocalUploadClick])

  // 移动端禁用 hover 事件
  const mouseHandlers = isMobile ? {} : {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  }

  // 动态生成 accept
  const acceptTypes: string[] = []
  if (canUploadImage)
    acceptTypes.push('image/*')
  if (canUploadVideo)
    acceptTypes.push('video/*')
  const accept = acceptTypes.join(',')

  const hoverMenuNode = isMounted
    ? createPortal(
        <AnimatePresence onExitComplete={() => setMenuPosition(null)}>
          {hoverMenuVisible && (
            <>
              {isMobile && (
                <motion.div
                  className="fixed inset-0 z-[999]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={MENU_TRANSITION}
                  onClick={() => setHoverMenuVisible(false)}
                />
              )}

              <motion.div
                ref={menuRef}
                className={styles.hoverMenuPortal}
                style={{
                  top: menuPosition?.top ?? 0,
                  left: menuPosition?.left ?? 0,
                  visibility: menuPosition ? 'visible' : 'hidden',
                }}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={MENU_TRANSITION}
                onMouseEnter={isMobile ? undefined : handleMouseEnter}
                onMouseLeave={isMobile ? undefined : handleMouseLeave}
              >
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleSelectStoreImages}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {t('detail.selectStoreImages')}
                </button>
                {(canUploadImage || canUploadVideo) && (
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={handleLocalUploadClick}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t('detail.localUpload')}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null

  return (
    <div
      ref={wrapperRef}
      className={cn(wrapperAbsolute ? styles.wrapperAbsolute : styles.wrapper, className)}
      {...mouseHandlers}
    >
      {/* 默认点击行为：桌面端本地上传，移动端切换菜单；Popover 仅通过菜单的"选择店铺图片"打开 */}
      <ImageSelectorPopover
        allImages={allImages}
        selectedIds={selectedIds}
        maxImages={maxImages}
        onImagesChange={onImagesChange}
        open={popoverOpen}
        onOpenChange={handlePopoverOpenChange}
        localImageCount={localImageCount}
      >
        <div onClick={handleTriggerClick}>
          {children}
        </div>
      </ImageSelectorPopover>

      {/* hover 浮层菜单通过 portal 挂到 body，避免被父容器裁剪 */}
      {hoverMenuNode}

      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
})

AddMediaButton.displayName = 'AddMediaButton'

export default AddMediaButton
