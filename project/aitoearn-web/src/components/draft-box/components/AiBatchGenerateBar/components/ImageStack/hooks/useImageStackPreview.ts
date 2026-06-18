import type { ImageStackPreviewType } from '../types'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { useCallback, useState } from 'react'

export function useImageStackPreview() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])

  const handleMediaClick = useCallback(
    (url: string, type: ImageStackPreviewType, title?: string) => {
      setPreviewItems([{ type, src: url, title }])
      setPreviewOpen(true)
    },
    [],
  )

  return {
    previewOpen,
    previewItems,
    setPreviewOpen,
    handleMediaClick,
  }
}
