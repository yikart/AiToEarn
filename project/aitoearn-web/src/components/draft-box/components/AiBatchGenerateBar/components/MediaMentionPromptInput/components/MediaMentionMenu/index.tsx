import type { BeautifulMentionsMenuProps } from 'lexical-beautiful-mentions'
import { Loader2 } from 'lucide-react'
import { useMediaMentionContext } from '../../context/MediaMentionContext'
import styles from '../../MediaMentionPromptInput.module.scss'

export function MediaMentionMenu({ loading, ...props }: BeautifulMentionsMenuProps) {
  const { loadingLabel } = useMediaMentionContext()

  if (loading) {
    return (
      <div className={styles.menuLoading}>
        <span>{loadingLabel}</span>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return <ul {...props} className={styles.menu} />
}
