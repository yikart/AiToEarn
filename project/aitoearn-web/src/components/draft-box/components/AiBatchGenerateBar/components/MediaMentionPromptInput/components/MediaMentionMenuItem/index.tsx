import type { BeautifulMentionsMenuItemProps } from 'lexical-beautiful-mentions'
import { forwardRef } from 'react'
import { cn } from '@/utils/className'
import { useMediaMentionContext } from '../../context/MediaMentionContext'
import styles from '../../MediaMentionPromptInput.module.scss'
import { getMentionMediaType, isEmptyMediaMentionAction } from '../../utils/mentionItems'
import { EmptyMediaMentionMenuContent } from '../EmptyMediaMentionMenuContent'
import { MediaMentionThumbnail } from '../MediaMentionThumbnail'

export const MediaMentionMenuItem = forwardRef<HTMLLIElement, BeautifulMentionsMenuItemProps>(
  (props, ref) => {
    const {
      selected,
      item,
      children: _children,
      itemValue: _itemValue,
      label: _label,
      mediaType: _mediaType,
      displayName: _displayName,
      typeLabel: _typeLabel,
      emptyMediaAction: _emptyMediaAction,
      ...liProps
    } = props as BeautifulMentionsMenuItemProps & Record<string, unknown>
    const { itemsByValue } = useMediaMentionContext()

    if (isEmptyMediaMentionAction(item.value)) {
      return (
        <li
          {...liProps}
          ref={ref}
          className={styles.menuEmptyItem}
          onClick={event => event.preventDefault()}
          onMouseDown={event => event.preventDefault()}
        >
          <EmptyMediaMentionMenuContent hideHint onMouseDown={event => event.preventDefault()} />
        </li>
      )
    }

    const mediaItem = itemsByValue.get(item.value)
    const mediaType = mediaItem?.type ?? getMentionMediaType(item.value)
    const displayName = mediaItem?.displayName ?? item.displayValue
    const typeLabel = mediaItem?.typeLabel ?? ''

    return (
      <li
        {...liProps}
        ref={ref}
        className={cn(styles.menuItem, selected && styles.menuItemSelected)}
      >
        <MediaMentionThumbnail
          item={mediaItem}
          mediaType={mediaType}
          className={styles.menuThumb}
          iconClassName={styles.menuThumbIcon}
          sizes="34px"
        />
        <span className={styles.menuText}>
          <span className={styles.menuName}>{displayName}</span>
          <span className={styles.menuToken}>
            {typeLabel ? `${typeLabel} · ` : ''}
            @
            {item.value}
          </span>
        </span>
      </li>
    )
  },
)
MediaMentionMenuItem.displayName = 'MediaMentionMenuItem'
