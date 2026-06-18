import type { MouseEvent } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { KEY_ESCAPE_COMMAND } from 'lexical'
import { Upload } from 'lucide-react'
import { useCallback } from 'react'
import { useMediaMentionContext } from '../../context/MediaMentionContext'
import styles from '../../MediaMentionPromptInput.module.scss'

interface EmptyMediaMentionMenuContentProps {
  hideHint?: boolean
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void
}

export function EmptyMediaMentionMenuContent({
  hideHint = false,
  onMouseDown,
}: EmptyMediaMentionMenuContentProps) {
  const { emptyMediaHintLabel, emptyMediaLabel, onRequestUpload, uploadMediaLabel }
    = useMediaMentionContext()
  const [editor] = useLexicalComposerContext()

  const handleUploadClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      editor.dispatchCommand(
        KEY_ESCAPE_COMMAND,
        new globalThis.KeyboardEvent('keydown', { key: 'Escape' }),
      )
      editor.getRootElement()?.blur()
      onRequestUpload?.()
    },
    [editor, onRequestUpload],
  )

  return (
    <div className={styles.menuEmpty}>
      {!hideHint && <p className={styles.menuEmptyHint}>{emptyMediaHintLabel}</p>}
      <div className={styles.menuEmptyBody}>
        <div className={styles.menuEmptyIcon} aria-hidden="true">
          <span className={styles.menuEmptyIconBack} />
          <span className={styles.menuEmptyIconFront}>
            <Upload className={styles.menuEmptyUploadIcon} />
          </span>
        </div>
        <p className={styles.menuEmptyText}>{emptyMediaLabel}</p>
        <button
          type="button"
          className={styles.menuEmptyButton}
          disabled={!onRequestUpload}
          onMouseDown={onMouseDown ?? (event => event.preventDefault())}
          onClick={handleUploadClick}
        >
          <span aria-hidden="true">+</span>
          {uploadMediaLabel}
        </button>
      </div>
    </div>
  )
}
