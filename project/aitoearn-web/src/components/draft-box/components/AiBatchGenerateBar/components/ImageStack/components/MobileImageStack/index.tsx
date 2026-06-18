import type { MobileImageStackProps } from '../../types'
import { Plus } from 'lucide-react'
import AddMediaButton from '../../../AddMediaButton'
import styles from '../../ImageStack.module.scss'
import { MediaStackCard } from '../MediaStackCard'

export function MobileImageStack({
  localMedias,
  showAddButton,
  accept,
  videoInfoMap,
  exitingKeys,
  onLocalUpload,
  onDelete,
  onPreview,
}: MobileImageStackProps) {
  return (
    <div data-testid="draftbox-ai-image-stack" className={styles.mobileGrid}>
      {localMedias.map((media, index) => (
        <MediaStackCard
          key={media.id || index}
          media={media}
          index={index}
          totalMediaCount={localMedias.length}
          isExpanded
          isMobile
          videoInfo={media.id ? videoInfoMap.get(media.id) : undefined}
          exitingKeys={exitingKeys}
          onDelete={onDelete}
          onPreview={onPreview}
          onExpand={() => undefined}
        />
      ))}
      {showAddButton && (
        <AddMediaButton onLocalUpload={onLocalUpload} accept={accept}>
          <button
            data-testid="draftbox-ai-add-media-btn"
            type="button"
            className={styles.mobileAddButton}
          >
            <Plus className="h-4 w-4" />
          </button>
        </AddMediaButton>
      )}
    </div>
  )
}
