import type {
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
} from 'lexical-beautiful-mentions'
import { LoadingOutlined } from '@ant-design/icons'
import { forwardRef } from 'react'
import styles from '../pubParmasMentionInput.module.scss'

/**
 * Menu component for the BeautifulMentionsPlugin.
 */
export function Menu({ loading, ...other }: BeautifulMentionsMenuProps) {
  if (loading) {
    return (
      <div className={styles.mentionMenuLoading}>
        <span>Loading</span>
        <LoadingOutlined />
      </div>
    )
  }
  return <ul className={styles.mentionMenu} {...other} />
}

/**
 * MenuItem component for the BeautifulMentionsPlugin.
 */
export const MenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ selected, item, itemValue, ...props }, ref) => (
  <li
    ref={ref}
    {...props}
    className={`${styles.mentionMenuItem} ${selected ? styles.selected : ''}`}
  />
))
MenuItem.displayName = 'MenuItem'
