import type { FC } from 'react'
import type { PublishRecordItem } from '@/api/platforms/publish.types'
import { memo } from 'react'
import RecordCore from './RecordCore'

export interface BoxDragPreviewProps {
  publishRecord: PublishRecordItem
  width?: number
}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(({ publishRecord, width }) => {
  return (
    <div className="inline-block -rotate-[7deg] transition-transform duration-300">
      <RecordCore publishRecord={publishRecord} dragPreviewWidth={width} />
    </div>
  )
})
