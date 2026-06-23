import type { VideoMediaCardProps } from '../../types'
import { Play } from 'lucide-react'
import { OssImage } from '@/components/common/OssImage'
import { useVideoThumbnail } from '@/hooks/useVideoThumbnail'
import { formatVideoDuration } from '@/utils/media'
import styles from '../../ImageStack.module.scss'

export function VideoMediaCard({ localInfo, videoUrl }: VideoMediaCardProps) {
  const remoteCoverUrl = useVideoThumbnail(localInfo?.coverUrl ? null : videoUrl)
  const coverUrl = localInfo?.coverUrl || remoteCoverUrl
  const duration = localInfo?.duration

  return (
    <div className="w-full h-full relative">
      {coverUrl ? (
        <OssImage
          src={coverUrl}
          alt=""
          fill
          className="object-cover"
          sizes="60px"
          unoptimized={coverUrl.startsWith('data:')}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center cursor-pointer">
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {duration != null && (
        <span className={styles.durationBadge}>{formatVideoDuration(duration)}</span>
      )}
    </div>
  )
}
