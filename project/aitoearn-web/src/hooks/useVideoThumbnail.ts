/**
 * useVideoThumbnail - 自动获取视频封面的 Hook
 * 从后端 API 获取视频封面，并通过 IndexedDB 持久化缓存
 */

import { useEffect } from 'react'
import { useThumbnailCache } from '@/store/thumbnailCache'

export function useVideoThumbnail(videoUrl: string | null | undefined): string {
  const thumbnailUrl = useThumbnailCache(state =>
    videoUrl ? (state.cache[videoUrl] || '') : '',
  )

  useEffect(() => {
    if (!videoUrl)
      return
    useThumbnailCache.getState().fetchThumbnail(videoUrl)
  }, [videoUrl])

  return thumbnailUrl
}
