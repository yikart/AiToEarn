import type { FC } from 'react'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { memo } from 'react'
import RecordCore from './RecordCore'

export interface BoxDragPreviewProps {
  publishRecord: PublishRecordItem
}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(
  ({ publishRecord }) => {
    return (
      <div className="inline-block -rotate-[7deg] transition-transform duration-300">
        <RecordCore publishRecord={publishRecord} />
      </div>
    )
  },
)
