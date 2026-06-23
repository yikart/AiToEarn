import type { VideoInfo } from '../types'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import { useEffect, useRef, useState } from 'react'
import { getVideoInfo } from '@/utils/media'

export function useVideoInfoMap(localMedias: IUploadedMedia[]) {
  const [videoInfoMap, setVideoInfoMap] = useState<Map<string, VideoInfo>>(new Map())
  const processingIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    localMedias.forEach((media) => {
      const mediaId = media.id
      if (media.type !== 'video' || !mediaId || !media.file)
        return
      if (videoInfoMap.has(mediaId) || processingIdsRef.current.has(mediaId))
        return

      processingIdsRef.current.add(mediaId)
      getVideoInfo(media.file)
        .then((info) => {
          setVideoInfoMap(prev => new Map(prev).set(mediaId, info))
        })
        .catch(() => {
          processingIdsRef.current.delete(mediaId)
        })
    })
  }, [localMedias, videoInfoMap])

  return videoInfoMap
}
