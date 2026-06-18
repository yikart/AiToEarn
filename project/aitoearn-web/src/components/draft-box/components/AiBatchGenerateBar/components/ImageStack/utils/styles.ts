import type { CSSProperties } from 'react'
import { EXPAND_GAP, ITEM_HEIGHT, ITEM_WIDTH } from './constants'

export function getExpandedContainerStyle(
  totalMediaCount: number,
  showAddButton: boolean,
): CSSProperties {
  const totalItems = totalMediaCount + (showAddButton ? 1 : 0)
  if (totalItems === 0) {
    return { width: ITEM_WIDTH, height: ITEM_HEIGHT + 10 }
  }
  return {
    width: totalItems * ITEM_WIDTH + (totalItems - 1) * EXPAND_GAP,
    height: Math.max(ITEM_HEIGHT, 70) + 10,
  }
}

export function getMobileMediaItemStyle(rotation: number): CSSProperties {
  return {
    '--expand-rotation': `${rotation}deg`,
    'transform': `rotate(${rotation}deg)`,
  } as CSSProperties
}

export function getExpandedMediaItemStyle(
  globalIndex: number,
  expandRotation: number,
): CSSProperties {
  return {
    '--expand-x': `${globalIndex * (ITEM_WIDTH + EXPAND_GAP)}px`,
    '--expand-rotation': `${expandRotation}deg`,
    '--stack-z': globalIndex,
  } as CSSProperties
}

export function getCollapsedMediaItemStyle(
  globalIndex: number,
  rotation: number,
  totalMediaCount: number,
): CSSProperties {
  return {
    transform: `rotate(${rotation}deg)`,
    zIndex: globalIndex,
    opacity: globalIndex >= totalMediaCount - 5 ? 1 : 0,
    pointerEvents: globalIndex >= totalMediaCount - 5 ? 'auto' : 'none',
  }
}

export function getAddButtonExpandedStyle(totalMediaCount: number): CSSProperties {
  return { '--expand-x': `${totalMediaCount * (ITEM_WIDTH + EXPAND_GAP)}px` } as CSSProperties
}
