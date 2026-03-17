/**
 * ImageSelectorPopover - 店铺图片选择弹出面板
 * 从品牌图片库中选择图片，side="bottom" 适配内联输入栏
 */

'use client'

import { Check, ImagePlus } from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getOssUrl } from '@/utils/oss'

interface ImageSelectorPopoverProps {
  allImages: any[]
  selectedIds: string[]
  maxImages: number
  onImagesChange: (ids: string[]) => void
  onOpenChange?: (open: boolean) => void
  /** 外部受控 open 状态 */
  open?: boolean
  /** 本地已上传的图片数量，用于联动计算总配额 */
  localImageCount?: number
  children: React.ReactNode
}

const ImageSelectorPopover = memo(({
  allImages,
  selectedIds,
  maxImages,
  onImagesChange,
  onOpenChange,
  open: controlledOpen,
  localImageCount = 0,
  children,
}: ImageSelectorPopoverProps) => {
  const { t } = useTransClient('brandPromotion')
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const lastToggleTimeRef = useRef(0)

  const handleOpenChange = useCallback((newOpen: boolean) => {
    // 选择图片后 200ms 内忽略 close 事件，防止 re-render 导致 Popover 意外关闭
    if (!newOpen && Date.now() - lastToggleTimeRef.current < 200)
      return
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [onOpenChange, controlledOpen])

  const handleToggleImage = useCallback((imageId: string) => {
    lastToggleTimeRef.current = Date.now()
    const isSelected = selectedIds.includes(imageId)
    if (isSelected) {
      onImagesChange(selectedIds.filter(id => id !== imageId))
    }
    else if (selectedIds.length + localImageCount < maxImages) {
      onImagesChange([...selectedIds, imageId])
    }
  }, [selectedIds, maxImages, localImageCount, onImagesChange])

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        allowInnerScroll
        className="w-72 p-3"
        side="bottom"
        align="start"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('detail.selectImages')}</span>
          <span className="text-xs text-muted-foreground">
            {t('detail.selectedCount', { count: selectedIds.length + localImageCount })}
            {' / '}
            {t('detail.maxImages', { max: maxImages })}
          </span>
        </div>

        {allImages.length === 0
          ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <ImagePlus className="mr-2 h-4 w-4" />
                {t('detail.noStoreImages')}
              </div>
            )
          : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {allImages.map(image => (
                  <button
                    key={image.id}
                    type="button"
                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer group border border-transparent hover:border-primary/50 transition-colors"
                    onClick={() => handleToggleImage(image.id)}
                  >
                    <Image
                      src={getOssUrl(image.url)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {selectedIds.includes(image.id) && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    {!selectedIds.includes(image.id) && selectedIds.length + localImageCount >= maxImages && (
                      <div className="absolute inset-0 bg-background/50" />
                    )}
                  </button>
                ))}
              </div>
            )}
      </PopoverContent>
    </Popover>
  )
})

ImageSelectorPopover.displayName = 'ImageSelectorPopover'

export default ImageSelectorPopover
