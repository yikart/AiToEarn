import type { CSSProperties, FC } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { memo, useEffect, useState } from 'react'
import RecordCore from './RecordCore'

const styles: CSSProperties = {
  display: 'inline-block',
  transform: 'rotate(-7deg)',
  WebkitTransform: 'rotate(-7deg)',
  transition: '0.3s',
}

export interface BoxDragPreviewProps {
  publishRecord: PublishRecordItem
}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(
  ({ publishRecord }) => {
    const [tickTock, setTickTock] = useState(false)

    useEffect(
      () => {
        const interval = setInterval(() => setTickTock(!tickTock), 500)
        return () => clearInterval(interval)
      },
      [tickTock],
    )

    return (
      <div style={styles}>
        <RecordCore publishRecord={publishRecord} />
      </div>
    )
  },
)
