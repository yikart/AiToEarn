/**
 * confirm - 命令式确认对话框工具
 * 用于替代 antd Modal.confirm
 */

import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { directTrans } from '@/app/i18n/client'
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

// 获取翻译文本
function getTranslations() {
  return {
    ok: directTrans('common', 'actions.ok'),
    cancel: directTrans('common', 'actions.cancel'),
  }
}

export interface ConfirmOptions {
  /** 对话框标题 */
  title?: React.ReactNode
  /** 对话框内容 */
  content?: React.ReactNode
  /** 确认按钮文字，默认 "确定" */
  okText?: string
  /** 取消按钮文字，默认 "取消"。传 null 则不显示取消按钮 */
  cancelText?: string | null
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
  okText,
  cancelText,
  okType = 'default',
  onOk,
  onCancel,
  icon,
  className,
}) => {
  const [loading, setLoading] = React.useState(false)
  const translations = getTranslations()

  // 使用传入的值或翻译的默认值
  const okButtonText = okText ?? translations.ok
  const cancelButtonText = cancelText ?? translations.cancel

  const handleOk = async (e?: React.MouseEvent) => {
    // 阻止 AlertDialogAction 的默认关闭行为
    e?.preventDefault()
    e?.stopPropagation()

    if (onOk) {
      try {
        setLoading(true)
        await onOk()
        // onOk 完成后，wrappedOptions.onOk 会处理 destroy 和 resolve
        // 手动关闭对话框（但此时 destroy 已经执行，所以这个调用可能无效，但不影响）
        onOpenChange(false)
      }
      finally {
        setLoading(false)
      }
    }
    else {
      // 如果没有 onOk 回调，直接关闭
      onOpenChange(false)
    }
  }

  const handleCancel = (e?: React.MouseEvent) => {
    // 阻止 AlertDialogCancel 的默认关闭行为
    e?.preventDefault()
    e?.stopPropagation()

    if (onCancel) {
      onCancel()
      // onCancel 完成后，wrappedOptions.onCancel 会处理 destroy 和 resolve
      // 手动关闭对话框（但此时 destroy 已经执行，所以这个调用可能无效，但不影响）
      onOpenChange(false)
    }
    else {
      // 如果没有 onCancel 回调，直接关闭
      onOpenChange(false)
    }
  }

  // 默认显示取消按钮，只有明确传 null 时才隐藏
  const showCancel = cancelText !== null

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
          {showCancel && (
            <AlertDialogCancel onClick={handleCancel} disabled={loading}>
              {cancelButtonText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleOk}
            disabled={loading}
            className={cn(
              okType === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {okButtonText}
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

    let isResolved = false

    const destroy = () => {
      root.unmount()
      container.remove()
    }

    const handleOpenChange = (open: boolean) => {
      if (!open && !isResolved) {
        // 如果对话框关闭但还没有 resolve，说明是点击外部或按 ESC 关闭
        isResolved = true
        destroy()
        resolve(false)
      }
    }

    const wrappedOptions: ConfirmOptions = {
      ...options,
      onOk: async () => {
        // 先设置 isResolved，防止 onOpenChange 触发时再次 resolve
        isResolved = true
        try {
          await options.onOk?.()
        }
        catch (error) {
          // 如果 onOk 出错，仍然 resolve true（因为用户已经确认了）
          console.error('onOk error:', error)
        }
        destroy()
        resolve(true)
      },
      onCancel: () => {
        // 先设置 isResolved，防止 onOpenChange 触发时再次 resolve
        isResolved = true
        try {
          options.onCancel?.()
        }
        catch (error) {
          console.error('onCancel error:', error)
        }
        destroy()
        resolve(false)
      },
    }

    root.render(<ConfirmDialog {...wrappedOptions} open={true} onOpenChange={handleOpenChange} />)
  })
}

export default confirm
