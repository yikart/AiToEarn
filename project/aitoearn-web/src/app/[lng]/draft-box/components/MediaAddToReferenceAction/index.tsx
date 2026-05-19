/**
 * MediaAddToReferenceAction - 图片资源追加到 AI 参考文件
 * 在纯图片资源卡片上提供一键追加到 AI 批量生成输入参考文件的入口
 */

'use client'

import type { MediaItem } from '@/api/types/media'
import { ImagePlus } from 'lucide-react'
import { memo, useCallback } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import { useDraftBoxConfigStore } from '../../draftBoxConfigStore'

interface MediaAddToReferenceActionProps {
  media: MediaItem
  groupId: string
  maxImages: number
}

export const MediaAddToReferenceAction = memo(({
  media,
  groupId,
  maxImages,
}: MediaAddToReferenceActionProps) => {
  const { t } = useTransClient('brandPromotion')

  const handleAddToReference = useCallback(() => {
    if (media.type !== 'img') {
      return
    }

    const { getConfig, appendPersistedMedias } = useDraftBoxConfigStore.getState()
    const currentConfig = getConfig(groupId)

    const persistedImageUrls = (currentConfig.persistedMedias ?? [])
      .filter(item => item.type === 'image')
      .map(item => getOssUrl(item.url))
    const currentImageCount = (currentConfig.selectedImageIds ?? []).length + persistedImageUrls.length
    const normalizedUrl = getOssUrl(media.url)

    if (persistedImageUrls.includes(normalizedUrl)) {
      toast.info(t('detail.draftImagesAlreadyInReference'))
      return
    }

    const availableCount = Math.max(0, maxImages - currentImageCount)
    if (availableCount === 0) {
      toast.warning(t('detail.imageCountExceeded', { max: maxImages }))
      return
    }

    const { added } = appendPersistedMedias(groupId, [{
      id: `media-reference-${media._id}`,
      url: normalizedUrl,
      type: 'image',
      name: media.title || undefined,
    }])

    if (added === 0) {
      toast.info(t('detail.draftImagesAlreadyInReference'))
      return
    }

    toast.success(t('detail.draftImagesAddedToReference', { count: added }))
  }, [groupId, maxImages, media, t])

  if (media.type !== 'img') {
    return null
  }

  return (
    <Button
      type="button"
      onClick={handleAddToReference}
      className={cn(
        'h-9 rounded-full border border-primary/25 bg-background/95 px-3 text-xs font-semibold text-foreground shadow-lg shadow-primary/15 backdrop-blur-md',
        'cursor-pointer gap-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-background hover:shadow-xl hover:shadow-primary/20',
      )}
    >
      <ImagePlus className="h-4 w-4 text-primary" />
      <span>{t('detail.addDraftImagesToReference')}</span>
    </Button>
  )
})

MediaAddToReferenceAction.displayName = 'MediaAddToReferenceAction'
