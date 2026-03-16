/**
 * CropOverlay - 裁剪框覆盖层组件
 * 使用 DOM 元素实现裁剪框交互（暗化遮罩 + 虚线边框 + 8 个手柄）
 */

'use client'

import type { CropRect } from './useCropEditor'
import { memo, useCallback, useRef } from 'react'

/** 手柄位置类型 */
type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** 手柄配置 - 使用 -6px 偏移让手柄在移动端更容易触摸 */
const HANDLES: { pos: HandlePosition, cursor: string, style: Record<string, string> }[] = [
  { pos: 'nw', cursor: 'nwse-resize', style: { top: '-6px', left: '-6px' } },
  { pos: 'n', cursor: 'ns-resize', style: { top: '-6px', left: '50%', transform: 'translateX(-50%)' } },
  { pos: 'ne', cursor: 'nesw-resize', style: { top: '-6px', right: '-6px' } },
  { pos: 'e', cursor: 'ew-resize', style: { top: '50%', right: '-6px', transform: 'translateY(-50%)' } },
  { pos: 'se', cursor: 'nwse-resize', style: { bottom: '-6px', right: '-6px' } },
  { pos: 's', cursor: 'ns-resize', style: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' } },
  { pos: 'sw', cursor: 'nesw-resize', style: { bottom: '-6px', left: '-6px' } },
  { pos: 'w', cursor: 'ew-resize', style: { top: '50%', left: '-6px', transform: 'translateY(-50%)' } },
]

export interface CropOverlayProps {
  /** 裁剪框（Canvas 像素坐标） */
  cropRect: CropRect
  /** 更新裁剪框 */
  onCropRectChange: (rect: CropRect) => void
  /** Canvas 像素尺寸 */
  canvasSize: { width: number, height: number }
  /** 显示尺寸 */
  displaySize: { width: number, height: number }
  /** 宽高比锁定（0 = 自由） */
  aspectRatio: number
}

export const CropOverlay = memo(({
  cropRect,
  onCropRectChange,
  canvasSize,
  displaySize,
  aspectRatio,
}: CropOverlayProps) => {
  const dragRef = useRef<{
    type: 'move' | HandlePosition
    startX: number
    startY: number
    startRect: CropRect
  } | null>(null)

  // 坐标转换比例
  const scaleX = canvasSize.width / displaySize.width
  const scaleY = canvasSize.height / displaySize.height

  // Canvas 坐标 -> 显示坐标
  const toDisplay = useCallback((rect: CropRect) => ({
    x: rect.x / scaleX,
    y: rect.y / scaleY,
    width: rect.width / scaleX,
    height: rect.height / scaleY,
  }), [scaleX, scaleY])

  const displayRect = toDisplay(cropRect)

  /** 约束裁剪框在 Canvas 范围内 */
  const clampRect = useCallback((rect: CropRect): CropRect => {
    const minSize = 20
    let { x, y, width, height } = rect
    width = Math.max(minSize, Math.min(width, canvasSize.width))
    height = Math.max(minSize, Math.min(height, canvasSize.height))
    x = Math.max(0, Math.min(x, canvasSize.width - width))
    y = Math.max(0, Math.min(y, canvasSize.height - height))
    return { x, y, width, height }
  }, [canvasSize])

  /** 处理拖拽移动 */
  const handlePointerDown = useCallback((e: React.PointerEvent, type: 'move' | HandlePosition) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
    }
  }, [cropRect])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current)
      return

    const { type, startX, startY, startRect } = dragRef.current
    const dx = (e.clientX - startX) * scaleX
    const dy = (e.clientY - startY) * scaleY

    if (type === 'move') {
      onCropRectChange(clampRect({
        ...startRect,
        x: startRect.x + dx,
        y: startRect.y + dy,
      }))
      return
    }

    // 手柄缩放
    let { x, y, width, height } = startRect

    // 根据手柄位置计算新尺寸
    if (type.includes('e')) {
      width = startRect.width + dx
    }
    if (type.includes('w')) {
      width = startRect.width - dx
      x = startRect.x + dx
    }
    if (type.includes('s')) {
      height = startRect.height + dy
    }
    if (type.includes('n')) {
      height = startRect.height - dy
      y = startRect.y + dy
    }

    // 最小尺寸
    const minSize = 20
    if (width < minSize) {
      if (type.includes('w'))
        x = startRect.x + startRect.width - minSize
      width = minSize
    }
    if (height < minSize) {
      if (type.includes('n'))
        y = startRect.y + startRect.height - minSize
      height = minSize
    }

    // 比例锁定
    if (aspectRatio > 0) {
      if (type === 'n' || type === 's') {
        width = height * aspectRatio
        x = startRect.x + (startRect.width - width) / 2
      }
      else if (type === 'e' || type === 'w') {
        height = width / aspectRatio
        y = startRect.y + (startRect.height - height) / 2
      }
      else {
        // 角手柄：以宽度为准
        const newHeight = width / aspectRatio
        if (type.includes('n')) {
          y = startRect.y + startRect.height - newHeight
        }
        height = newHeight
      }
    }

    onCropRectChange(clampRect({ x, y, width, height }))
  }, [scaleX, scaleY, aspectRatio, onCropRectChange, clampRect])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 暗化遮罩 - 上 */}
      <div
        className="absolute left-0 right-0 top-0 bg-black/50"
        style={{ height: displayRect.y }}
      />
      {/* 暗化遮罩 - 下 */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-black/50"
        style={{ height: displaySize.height - displayRect.y - displayRect.height }}
      />
      {/* 暗化遮罩 - 左 */}
      <div
        className="absolute left-0 bg-black/50"
        style={{
          top: displayRect.y,
          width: displayRect.x,
          height: displayRect.height,
        }}
      />
      {/* 暗化遮罩 - 右 */}
      <div
        className="absolute right-0 bg-black/50"
        style={{
          top: displayRect.y,
          width: displaySize.width - displayRect.x - displayRect.width,
          height: displayRect.height,
        }}
      />

      {/* 裁剪框 */}
      <div
        className="absolute border-2 border-white cursor-move"
        style={{
          left: displayRect.x,
          top: displayRect.y,
          width: displayRect.width,
          height: displayRect.height,
        }}
        onPointerDown={e => handlePointerDown(e, 'move')}
      >
        {/* 三分线 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* 8 个手柄 */}
        {HANDLES.map(({ pos, cursor, style }) => (
          <div
            key={pos}
            className="absolute w-3.5 h-3.5 sm:w-3 sm:h-3 bg-white rounded-sm shadow-md"
            style={{ ...style, cursor }}
            onPointerDown={e => handlePointerDown(e, pos)}
          />
        ))}
      </div>
    </div>
  )
})

export default CropOverlay
