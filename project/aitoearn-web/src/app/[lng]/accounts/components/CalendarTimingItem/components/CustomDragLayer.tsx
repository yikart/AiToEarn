import type { CSSProperties, FC } from 'react'
import type { XYCoord } from 'react-dnd'
import type { PublishRecordItem } from '@/api/platforms/publish.types'
import { useDragLayer } from 'react-dnd'
import { createPortal } from 'react-dom'
import { BoxDragPreview } from './BoxDragPreview'
import { useDragAutoScroll } from './useDragAutoScroll'

function snapToGrid(x: number, y: number): [number, number] {
  const snappedX = Math.round(x / 32) * 32
  const snappedY = Math.round(y / 32) * 32
  return [snappedX, snappedY]
}

const layerStyles: CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 1000,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}

function getItemStyles(
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null,
  isSnapToGrid: boolean,
) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    }
  }

  let { x, y } = currentOffset

  if (isSnapToGrid) {
    x -= initialOffset.x
    y -= initialOffset.y
    ;[x, y] = snapToGrid(x, y)
    x += initialOffset.x
    y += initialOffset.y
  }

  const transform = `translate(${x}px, ${y}px)`
  return {
    transform,
    WebkitTransform: transform,
  }
}

export interface CustomDragLayerProps {
  snapToGrid: boolean
  publishRecord: PublishRecordItem
}

interface CalendarDragLayerItem {
  publishRecord: PublishRecordItem
  dragPreviewWidth?: number
}

function isCalendarDragItem(value: unknown): value is CalendarDragLayerItem {
  if (typeof value !== 'object' || value === null || !('publishRecord' in value))
    return false

  const publishRecord = value.publishRecord
  return typeof publishRecord === 'object' && publishRecord !== null && 'id' in publishRecord
}

export const CustomDragLayer: FC<CustomDragLayerProps> = (props) => {
  const { itemType, isDragging, item, initialOffset, currentOffset, clientOffset }
    = useDragLayer(monitor => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(), // 元素左上角位置
      currentOffset: monitor.getSourceClientOffset(),
      clientOffset: monitor.getClientOffset(),
      isDragging: monitor.isDragging(),
    }))
  const isActiveDragLayer = isDragging
    && itemType === 'box'
    && isCalendarDragItem(item)
    && item.publishRecord.id === props.publishRecord.id

  useDragAutoScroll(isActiveDragLayer, clientOffset)

  // 使用 Portal 将拖拽层渲染到 document.body，避免被父容器限制
  if (!isActiveDragLayer || !isCalendarDragItem(item)) {
    return null
  }

  return createPortal(
    <div style={layerStyles}>
      <div
        style={{
          ...getItemStyles(initialOffset, currentOffset, props.snapToGrid),
          position: 'relative',
          zIndex: 10001111,
        }}
      >
        <BoxDragPreview publishRecord={item.publishRecord} width={item.dragPreviewWidth} />
      </div>
    </div>,
    document.body,
  )
}
