/**
 * Modal - 通用模态框组件
 * 基于 shadcn/ui Dialog 封装，提供与 antd Modal 类似的 API
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ModalProps {
  /** 是否显示模态框 */
  open?: boolean
  /** 标题 */
  title?: React.ReactNode
  /** 子内容 */
  children?: React.ReactNode
  /** 底部按钮区域，传入 null 则不显示 */
  footer?: React.ReactNode | null
  /** 确认按钮文字 */
  okText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 确认按钮 loading */
  confirmLoading?: boolean
  /** 宽度，支持数字(px)或字符串 */
  width?: number | string
  /** 是否居中显示 */
  centered?: boolean
  /** 关闭时是否销毁子元素 */
  destroyOnClose?: boolean
  /** 是否显示关闭按钮 */
  closable?: boolean
  /** 点击蒙层是否允许关闭 */
  maskClosable?: boolean
  /** 关闭时回调 */
  onCancel?: () => void
  /** 点击确定回调 */
  onOk?: () => void
  /** 自定义类名 */
  className?: string
  /** 内容区域类名 */
  bodyClassName?: string
  /** z-index */
  zIndex?: number
}

/**
 * Modal 模态框组件
 *
 * @example
 * ```tsx
 * import { Modal } from '@/components/ui/modal'
 *
 * <Modal
 *   open={visible}
 *   title="标题"
 *   onCancel={() => setVisible(false)}
 *   onOk={handleSubmit}
 * >
 *   内容
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  open = false,
  title,
  children,
  footer,
  okText = '确定',
  cancelText = '取消',
  confirmLoading = false,
  width = 520,
  centered = true,
  destroyOnClose = false,
  closable = true,
  maskClosable = true,
  onCancel,
  onOk,
  className,
  bodyClassName,
  zIndex,
}) => {
  // 处理宽度 - 'auto' 或 undefined 时不设置内联宽度，让 CSS 控制
  // 使用 CSS 变量来允许媒体查询覆盖
  const shouldSetWidthStyle = width !== 'auto' && width !== undefined
  const widthValue = typeof width === 'number' ? `${width}px` : width

  // 如果 destroyOnClose 为 true 且 modal 关闭，不渲染 children
  const shouldRenderContent = destroyOnClose ? open : true

  // 默认 footer
  const defaultFooter = (
    <>
      <Button variant="outline" onClick={onCancel} disabled={confirmLoading}>
        {cancelText}
      </Button>
      <Button onClick={onOk} disabled={confirmLoading}>
        {confirmLoading ? '处理中...' : okText}
      </Button>
    </>
  )

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel?.()
    }
  }

  const handleInteractOutside = (e: Event) => {
    if (!maskClosable) {
      e.preventDefault()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-hidden flex flex-col',
          // 移动端响应式宽度
          'w-[calc(100vw-24px)] sm:w-auto',
          !closable && '[&>button]:hidden',
          className,
        )}
        style={{
          // 使用 CSS 变量，允许媒体查询覆盖
          '--modal-width': shouldSetWidthStyle ? widthValue : undefined,
          width: shouldSetWidthStyle ? 'min(var(--modal-width), calc(100vw - 24px))' : undefined,
          maxWidth: shouldSetWidthStyle ? 'min(var(--modal-width), calc(100vw - 24px))' : undefined,
          ...(zIndex ? { zIndex } : {}),
        } as React.CSSProperties}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={!closable ? (e) => e.preventDefault() : undefined}
        aria-describedby={title ? undefined : undefined}
      >
        {title
          ? (
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {/* 隐藏的描述，用于满足无障碍要求 */}
                <DialogDescription className="sr-only">
                  {typeof title === 'string' ? title : 'Modal dialog'}
                </DialogDescription>
              </DialogHeader>
            )
          : (
              <>
                {/* 无标题时也需要隐藏的标题和描述 */}
                <DialogTitle className="sr-only">Dialog</DialogTitle>
                <DialogDescription className="sr-only">Dialog content</DialogDescription>
              </>
            )}

        {shouldRenderContent && (
          <div className={cn('flex-1 py-2 w-full flex', bodyClassName)}>
            {children}
          </div>
        )}

        {footer !== null && (
          <DialogFooter>
            {footer === undefined ? defaultFooter : footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// 为了与 antd Modal 使用方式兼容，也导出一个 default
export default Modal

