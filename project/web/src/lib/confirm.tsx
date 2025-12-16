/**
 * confirm - 命令式确认对话框工具
 * 用于替代 antd Modal.confirm
 */

import * as React from 'react'
import { createRoot } from 'react-dom/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface ConfirmOptions {
  /** 对话框标题 */
  title?: React.ReactNode
  /** 对话框内容 */
  content?: React.ReactNode
  /** 确认按钮文字，默认 "确定" */
  okText?: string
  /** 取消按钮文字，默认 "取消" */
  cancelText?: string
  /** 确认按钮类型 */
  okType?: 'default' | 'destructive'
  /** 点击确认回调 */
  onOk?: () => void | Promise<void>
  /** 点击取消回调 */
  onCancel?: () => void
  /** 是否居中显示 */
  centered?: boolean
  /** 自定义图标 */
  icon?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 确认对话框组件
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  content,
  okText = '确定',
  cancelText = '取消',
  okType = 'default',
  onOk,
  onCancel,
  icon,
  className,
}) => {
  const [loading, setLoading] = React.useState(false)

  const handleOk = async () => {
    if (onOk) {
      try {
        setLoading(true)
        await onOk()
      } finally {
        setLoading(false)
      }
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn('max-w-[420px]', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </AlertDialogTitle>
          {content && (
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">{content}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleOk}
            disabled={loading}
            className={cn(
              okType === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {loading ? '处理中...' : okText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * 命令式调用确认对话框
 *
 * @example
 * ```tsx
 * import { confirm } from '@/lib/confirm'
 *
 * confirm({
 *   title: '确认删除？',
 *   content: '此操作不可恢复',
 *   okType: 'destructive',
 *   onOk: async () => {
 *     await deleteItem()
 *   },
 * })
 * ```
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    container.id = `confirm-dialog-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    const destroy = () => {
      root.unmount()
      container.remove()
    }

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        destroy()
        resolve(false)
      }
    }

    const wrappedOptions: ConfirmOptions = {
      ...options,
      onOk: async () => {
        await options.onOk?.()
        destroy()
        resolve(true)
      },
      onCancel: () => {
        options.onCancel?.()
        destroy()
        resolve(false)
      },
    }

    root.render(
      <ConfirmDialog
        {...wrappedOptions}
        open={true}
        onOpenChange={handleOpenChange}
      />,
    )
  })
}

export default confirm

