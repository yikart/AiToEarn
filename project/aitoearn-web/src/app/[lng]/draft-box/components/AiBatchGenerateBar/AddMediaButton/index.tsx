/**
 * AddMediaButton - 添加媒体按钮
 * hover 显示菜单（选择店铺图片 / 本地上传），点击默认打开店铺图片选择
 */

'use client'

import { ImageIcon, Upload } from 'lucide-react'
import { memo, useCallback, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import ImageSelectorPopover from '../ImageSelectorPopover'
import styles from './AddMediaButton.module.scss'

interface AddMediaButtonProps {
  allImages: any[]
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

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

  return (
    <div
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

      {/* 移动端：菜单显示时渲染透明遮罩，点击关闭菜单 */}
      {isMobile && hoverMenuVisible && (
        <div
          className="fixed inset-0 z-[29]"
          onClick={() => setHoverMenuVisible(false)}
        />
      )}

      {/* hover 浮层菜单（桌面端 hover 显示，移动端点击显示） */}
      {hoverMenuVisible && (
        <div className={styles.hoverMenu}>
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
        </div>
      )}

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
