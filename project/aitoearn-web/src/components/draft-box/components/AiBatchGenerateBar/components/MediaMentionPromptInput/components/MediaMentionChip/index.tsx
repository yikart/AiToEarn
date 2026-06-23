import type { BeautifulMentionComponentProps } from 'lexical-beautiful-mentions'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { MediaMentionNodeData } from '../../types'
import { forwardRef, useCallback } from 'react'
import { cn } from '@/utils/className'
import { useMediaMentionContext } from '../../context/MediaMentionContext'
import styles from '../../MediaMentionPromptInput.module.scss'
import { getDataString, getMentionMediaType } from '../../utils/mentionItems'
import { MediaMentionThumbnail } from '../MediaMentionThumbnail'

export const MediaMentionChip = forwardRef<
  HTMLButtonElement,
  BeautifulMentionComponentProps<MediaMentionNodeData>
>(({ value, data, className, children: _children, ...props }, ref) => {
  const { itemsByValue, missingMediaLabel, onPreview } = useMediaMentionContext()
  const item = itemsByValue.get(value)
  const mediaType
    = item?.type
      ?? getMentionMediaType(getDataString(data, 'mediaType') ?? '')
      ?? getMentionMediaType(value)
  const displayName = item?.displayName ?? getDataString(data, 'displayName') ?? `@${value}`
  const typeLabel = item?.typeLabel ?? getDataString(data, 'typeLabel') ?? ''
  const isMissing = !item

  const handlePreview = useCallback(() => {
    if (item)
      onPreview(value)
  }, [item, onPreview, value])

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ')
        return
      event.preventDefault()
      handlePreview()
    },
    [handlePreview],
  )

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={cn(className, styles.mentionChipButton, isMissing && styles.mentionChipMissing)}
      title={isMissing ? missingMediaLabel : `${typeLabel ? `${typeLabel} · ` : ''}${displayName}`}
      aria-label={isMissing ? missingMediaLabel : displayName}
      aria-disabled={isMissing}
      onClick={handlePreview}
      onKeyDown={handleKeyDown}
    >
      <MediaMentionThumbnail
        item={item}
        mediaType={mediaType}
        className={styles.mentionThumb}
        iconClassName={styles.mentionThumbIcon}
        sizes="24px"
      />
      <span className={styles.mentionName}>{displayName}</span>
    </button>
  )
})
MediaMentionChip.displayName = 'MediaMentionChip'
