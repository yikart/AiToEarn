/**
 * PublishDialogDragPreviewLayer - 发布弹框拖拽预览层
 * 将草稿/素材拖拽预览通过 Portal 渲染到 body 顶层，避免被弹框内容遮挡。
 */

import type { CSSProperties } from 'react'
import type { XYCoord } from 'react-dnd'
import type { PublishDialogDragItem } from '@/components/PublishDialog/PublishDialog.util'
import { useDragLayer } from 'react-dnd'
import { createPortal } from 'react-dom'
import OssImage from '@/components/common/OssImage'
import { PUBLISH_DIALOG_DND_TYPE } from '@/components/PublishDialog/PublishDialog.util'

const layerStyles: CSSProperties = {
  height: '100%',
  left: 0,
  pointerEvents: 'none',
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 10001112,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPublishDialogDragItem(value: unknown): value is PublishDialogDragItem {
  if (!isRecord(value))
    return false

  if (value.kind === 'draft')
    return isRecord(value.material)

  if (value.kind === 'media')
    return isRecord(value.media)

  return false
}

const PREVIEW_WIDTH = 220
const PREVIEW_HEIGHT = 112

function getPreviewStyles(currentOffset: XYCoord | null): CSSProperties {
  if (!currentOffset) {
    return { display: 'none' }
  }

  const x = currentOffset.x - PREVIEW_WIDTH / 2
  const y = currentOffset.y - PREVIEW_HEIGHT / 2
  const transform = `translate3d(${x}px, ${y}px, 0)`
  return {
    transform,
    WebkitTransform: transform,
  }
}

function getPreviewData(item: PublishDialogDragItem) {
  if (item.kind === 'draft') {
    const imageMedia = item.material.mediaList?.find(media => media.type === 'img')
    return {
      description: item.material.desc || '',
      src: item.material.coverUrl || imageMedia?.url || '/images/placeholder.png',
      title: item.material.title || '',
    }
  }

  return {
    description: item.media.desc || '',
    src: item.media.thumbUrl || item.media.url || '/images/placeholder.png',
    title: item.media.title || '',
  }
}

export function PublishDialogDragPreviewLayer() {
  const { itemType, isDragging, item, currentOffset } = useDragLayer(monitor => ({
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
  }))

  if (
    typeof document === 'undefined'
    || !isDragging
    || itemType !== PUBLISH_DIALOG_DND_TYPE
    || !isPublishDialogDragItem(item)
  ) {
    return null
  }

  const previewData = getPreviewData(item)

  return createPortal(
    <div style={layerStyles}>
      <div style={getPreviewStyles(currentOffset)} className="w-[220px] overflow-hidden rounded-xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-sm">
        <div className="relative h-[112px] w-full overflow-hidden rounded-lg bg-muted">
          <OssImage
            src={previewData.src}
            alt={previewData.title}
            fill
            sizes="220px"
            thumbnailWidth={440}
            thumbnailHeight={224}
            className="object-cover"
          />
        </div>
        {(previewData.title || previewData.description) && (
          <div className="px-1 pt-2">
            {previewData.title && (
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {previewData.title}
              </p>
            )}
            {previewData.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {previewData.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
