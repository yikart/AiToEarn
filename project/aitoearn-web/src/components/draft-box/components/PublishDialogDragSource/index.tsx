/**
 * PublishDialogDragSource - 发布弹框左栏拖拽源包装组件
 * 仅在发布弹框内启用，避免普通草稿页缺少 DndProvider 时触发 react-dnd 上下文错误。
 */

'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import type { DragSourceMonitor } from 'react-dnd'
import type { PublishDialogDragItem } from '@/components/PublishDialog/PublishDialog.util'
import { memo, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { PUBLISH_DIALOG_DND_TYPE } from '@/components/PublishDialog/PublishDialog.util'
import { cn } from '@/utils/className'

interface PublishDialogDragSourceProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  dragItem: PublishDialogDragItem
  children: ReactNode
}

export const PublishDialogDragSource = memo(({ dragItem, className, children, ...props }: PublishDialogDragSourceProps) => {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: PUBLISH_DIALOG_DND_TYPE,
      item: dragItem,
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [dragItem],
  )

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  return (
    <div
      ref={(node) => {
        drag(node)
      }}
      className={cn(className, 'cursor-grab active:cursor-grabbing', isDragging && 'opacity-50')}
      {...props}
    >
      {children}
    </div>
  )
})

PublishDialogDragSource.displayName = 'PublishDialogDragSource'
