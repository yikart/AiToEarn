import type { MouseEvent } from 'react'
import type { MediaStackCardProps } from '../../types'
import { X } from 'lucide-react'
import { OssImage } from '@/components/common/OssImage'
import { cn } from '@/utils/className'
import styles from '../../ImageStack.module.scss'
import { EXPAND_ROTATIONS, STACK_ROTATIONS } from '../../utils/constants'
import {
  getAudioDisplayName,
  getLocalMediaPreviewSrc,
  getMediaPreviewType,
} from '../../utils/media'
import {
  getCollapsedMediaItemStyle,
  getExpandedMediaItemStyle,
  getMobileMediaItemStyle,
} from '../../utils/styles'
import { AudioMediaCard } from '../AudioMediaCard'
import { UploadProgressOverlay } from '../UploadProgressOverlay'
import { VideoMediaCard } from '../VideoMediaCard'

export function MediaStackCard({
  media,
  index,
  totalMediaCount,
  isExpanded,
  isMobile,
  videoInfo,
  exitingKeys,
  onDelete,
  onPreview,
  onExpand,
}: MediaStackCardProps) {
  const rotation = STACK_ROTATIONS[index % STACK_ROTATIONS.length]
  const expandRotation = EXPAND_ROTATIONS[index % EXPAND_ROTATIONS.length]
  const isVideo = media.type === 'video'
  const isAudio = media.type === 'audio'
  const isUploading = media.progress !== undefined
  const previewSrc = getLocalMediaPreviewSrc(media)
  const isExiting = exitingKeys.has(`local-${media.id}`)
  const itemClassName = isMobile
    ? cn(styles.mobileGridItem, isAudio && styles.audioItem, isExiting && styles.imageItemExiting)
    : cn(
        styles.imageItem,
        isAudio && styles.audioItem,
        isExpanded && styles.imageItemExpanded,
        isExiting && styles.imageItemExiting,
      )
  const itemStyle = isMobile
    ? getMobileMediaItemStyle(expandRotation)
    : isExpanded
      ? getExpandedMediaItemStyle(index, expandRotation)
      : getCollapsedMediaItemStyle(index, rotation, totalMediaCount)

  const handleClick = () => {
    if ((!isMobile && !isExpanded) || isUploading || !media.url)
      return
    onPreview(
      media.url,
      getMediaPreviewType(media),
      isAudio ? getAudioDisplayName(media) : undefined,
    )
  }

  const handleDeleteClick = (event: MouseEvent) => {
    if (!media.id)
      return
    onDelete(event, media.id)
  }

  return (
    <div
      className={itemClassName}
      style={itemStyle}
      onMouseEnter={isMobile ? undefined : onExpand}
      onClick={handleClick}
    >
      <div className="relative w-full h-full overflow-hidden rounded-md cursor-pointer">
        {isVideo ? (
          <VideoMediaCard localInfo={videoInfo} videoUrl={media.url} />
        ) : isAudio ? (
          <AudioMediaCard name={getAudioDisplayName(media)} />
        ) : previewSrc ? (
          <OssImage
            src={previewSrc}
            alt=""
            fill
            className="object-cover"
            sizes="60px"
            unoptimized={!media.url}
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        {isUploading && <UploadProgressOverlay progress={media.progress} />}
      </div>
      {(isMobile || isExpanded) && (
        <button
          type="button"
          className={isMobile ? styles.mobileDeleteButton : styles.deleteButton}
          onClick={handleDeleteClick}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}
