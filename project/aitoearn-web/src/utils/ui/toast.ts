import type { CSSProperties, ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  key?: string
  id?: string
  duration?: number
  content?: ReactNode
  className?: string
  style?: CSSProperties
}

const legacySafeToastStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: 16,
  boxSizing: 'border-box',
}

function getToastOptions(options?: ToastOptions, defaultDuration = 3000) {
  return {
    id: options?.key || options?.id,
    duration: options?.duration ? options.duration * 1000 : defaultDuration,
    className: ['app-toast', options?.className].filter(Boolean).join(' '),
    style: {
      ...legacySafeToastStyle,
      ...options?.style,
    },
  }
}

/**
 * Toast 消息工具
 * 用于替代 antd 的 message 组件
 */
export const toast = {
  /**
   * 成功消息
   */
  success(content: ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.success(opts.content, getToastOptions(opts))
    }
    return sonnerToast.success(content as ReactNode, getToastOptions(options))
  },

  /**
   * 错误消息
   */
  error(content: ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.error(opts.content, getToastOptions(opts))
    }
    return sonnerToast.error(content as ReactNode, getToastOptions(options))
  },

  /**
   * 警告消息
   */
  warning(content: ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.warning(opts.content, getToastOptions(opts))
    }
    return sonnerToast.warning(content as ReactNode, getToastOptions(options))
  },

  /**
   * 信息消息
   */
  info(content: ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.info(opts.content, getToastOptions(opts))
    }
    return sonnerToast.info(content as ReactNode, getToastOptions(options))
  },

  /**
   * 加载消息
   */
  loading(content: ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.loading(opts.content, getToastOptions(opts, Infinity))
    }
    return sonnerToast.loading(content as ReactNode, getToastOptions(options, Infinity))
  },

  /**
   * 打开自定义类型消息 (兼容 antd message.open)
   */
  open(
    options: ToastOptions & {
      type?: 'success' | 'error' | 'warning' | 'info' | 'loading'
      content: ReactNode
    },
  ) {
    const type = options.type || 'info'
    const toastFn = type === 'loading' ? sonnerToast.loading : sonnerToast[type]
    return toastFn(options.content, getToastOptions(options, type === 'loading' ? Infinity : 3000))
  },

  /**
   * 关闭指定消息
   */
  destroy(key?: string) {
    if (key) {
      sonnerToast.dismiss(key)
    }
    else {
      sonnerToast.dismiss()
    }
  },

  /**
   * 关闭指定消息 (dismiss 别名，兼容 sonner API)
   */
  dismiss(key?: string | number) {
    if (key) {
      sonnerToast.dismiss(key)
    }
    else {
      sonnerToast.dismiss()
    }
  },

  /**
   * 关闭所有消息
   */
  dismissAll() {
    sonnerToast.dismiss()
  },
}

export default toast
