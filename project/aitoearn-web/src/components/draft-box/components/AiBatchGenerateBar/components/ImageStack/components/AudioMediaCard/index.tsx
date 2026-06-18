import type { AudioMediaCardProps } from '../../types'
import { Music } from 'lucide-react'
import styles from '../../ImageStack.module.scss'

export function AudioMediaCard({ name }: AudioMediaCardProps) {
  return (
    <div className={styles.audioCard} title={name}>
      <Music className={styles.audioIcon} />
      {name && <span className={styles.audioName}>{name}</span>}
    </div>
  )
}
