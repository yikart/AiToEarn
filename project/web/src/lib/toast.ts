import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  key?: string
  id?: string
  duration?: number
  content?: React.ReactNode
}

/**
 * Toast 消息工具
 * 用于替代 antd 的 message 组件
 */
export const toast = {
  /**
   * 成功消息
   */
  success(content: React.ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.success(opts.content, {
        id: opts.key || opts.id,
        duration: opts.duration ? opts.duration * 1000 : 3000,
      })
    }
    return sonnerToast.success(content as React.ReactNode, {
      id: options?.key || options?.id,
      duration: options?.duration ? options.duration * 1000 : 3000,
    })
  },

  /**
   * 错误消息
   */
  error(content: React.ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.error(opts.content, {
        id: opts.key || opts.id,
        duration: opts.duration ? opts.duration * 1000 : 3000,
      })
    }
    return sonnerToast.error(content as React.ReactNode, {
      id: options?.key || options?.id,
      duration: options?.duration ? options.duration * 1000 : 3000,
    })
  },

  /**
   * 警告消息
   */
  warning(content: React.ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.warning(opts.content, {
        id: opts.key || opts.id,
        duration: opts.duration ? opts.duration * 1000 : 3000,
      })
    }
    return sonnerToast.warning(content as React.ReactNode, {
      id: options?.key || options?.id,
      duration: options?.duration ? options.duration * 1000 : 3000,
    })
  },

  /**
   * 信息消息
   */
  info(content: React.ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.info(opts.content, {
        id: opts.key || opts.id,
        duration: opts.duration ? opts.duration * 1000 : 3000,
      })
    }
    return sonnerToast.info(content as React.ReactNode, {
      id: options?.key || options?.id,
      duration: options?.duration ? options.duration * 1000 : 3000,
    })
  },

  /**
   * 加载消息
   */
  loading(content: React.ReactNode | ToastOptions, options?: ToastOptions) {
    if (typeof content === 'object' && content !== null && 'content' in content) {
      const opts = content as ToastOptions
      return sonnerToast.loading(opts.content, {
        id: opts.key || opts.id,
        duration: opts.duration ? opts.duration * 1000 : Infinity,
      })
    }
    return sonnerToast.loading(content as React.ReactNode, {
      id: options?.key || options?.id,
      duration: options?.duration ? options.duration * 1000 : Infinity,
    })
  },

  /**
   * 打开自定义类型消息 (兼容 antd message.open)
   */
  open(options: { key?: string, type?: 'success' | 'error' | 'warning' | 'info' | 'loading', content: React.ReactNode, duration?: number }) {
    const type = options.type || 'info'
    const toastFn = type === 'loading' ? sonnerToast.loading : sonnerToast[type]
    return toastFn(options.content, {
      id: options.key,
      duration: options.duration ? options.duration * 1000 : (type === 'loading' ? Infinity : 3000),
    })
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
