import type { CSSProperties, FC } from 'react'
import type { XYCoord } from 'react-dnd'
import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { useEffect, useMemo, useState } from 'react'
import { useDragLayer } from 'react-dnd'
import { createPortal } from 'react-dom'
import { BoxDragPreview } from './BoxDragPreview'

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
    y -= initialOffset.y;
    [x, y] = snapToGrid(x, y)
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

export const CustomDragLayer: FC<CustomDragLayerProps> = (props) => {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
    initialMouseOffset,
  } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(), // 元素左上角位置
    currentOffset: monitor.getSourceClientOffset(), // 鼠标当前位置
    initialMouseOffset: monitor.getInitialClientOffset(), // 鼠标开始拖拽时的位置
    isDragging: monitor.isDragging(),
  }))

  // 使用 Portal 将拖拽层渲染到 document.body，避免被父容器限制
  if (!isDragging) {
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
        <BoxDragPreview publishRecord={props.publishRecord} />
      </div>
    </div>,
    document.body,
  )
}
