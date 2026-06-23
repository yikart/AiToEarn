import { Upload } from 'lucide-react'
import styles from '../../styles/AiBatchGenerateBar.module.scss'

interface DragUploadOverlayProps {
  label: string
}

export function DragUploadOverlay({ label }: DragUploadOverlayProps) {
  return (
    <div className={styles.overlay}>
      <Upload className="h-8 w-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
