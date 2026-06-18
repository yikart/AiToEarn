import type { MediaMentionItem, MediaMentionType } from '../../types'
import { FileImage, Music, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { OssImage } from '@/components/common/OssImage'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { cn } from '@/utils/className'
import { getVideoInfo } from '@/utils/media'
import styles from '../../MediaMentionPromptInput.module.scss'

interface MediaMentionThumbnailProps {
  item?: MediaMentionItem
  mediaType: MediaMentionType | null
  className: string
  iconClassName: string
  sizes: string
}

export function MediaMentionThumbnail({
  item,
  mediaType,
  className,
  iconClassName,
  sizes,
}: MediaMentionThumbnailProps) {
  const [localCoverUrl, setLocalCoverUrl] = useState('')
  const remoteCoverUrl = useVideoThumbnail(item?.type === 'video' && !item.file ? item.src : null)
  const coverUrl = item?.type === 'video' ? localCoverUrl || remoteCoverUrl : ''
  const isAudio = item?.type === 'audio' || mediaType === 'audio'

  useEffect(() => {
    if (item?.type !== 'video' || !item.file) {
      setLocalCoverUrl('')
      return
    }

    let cancelled = false
    getVideoInfo(item.file)
      .then((info) => {
        if (!cancelled)
          setLocalCoverUrl(info.coverUrl)
      })
      .catch(() => {
        if (!cancelled)
          setLocalCoverUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [item?.file, item?.type])

  return (
    <span className={cn(className, isAudio && styles.audioThumb)} aria-hidden="true">
      {item?.type === 'image' ? (
        <OssImage src={item.src} alt="" fill className="object-cover" sizes={sizes} />
      ) : item?.type === 'video' && coverUrl ? (
        <OssImage
          src={coverUrl}
          alt=""
          fill
          className="object-cover"
          sizes={sizes}
          unoptimized={coverUrl.startsWith('data:')}
        />
      ) : isAudio ? (
        <Music className={iconClassName} />
      ) : mediaType === 'video' ? (
        <Play className={iconClassName} />
      ) : (
        <FileImage className={iconClassName} />
      )}
    </span>
  )
}
