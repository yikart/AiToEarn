/**
 * 关闭弹窗确认 Hook
 * 统一处理发布弹窗关闭前的确认逻辑
 */

import { AlertCircle } from 'lucide-react'
import { useCallback } from 'react'
import { confirm } from '@/lib/confirm'

interface UseCloseDialogParams {
  onClose: () => void
  t: (key: string, params?: Record<string, string>) => string
}

/**
 * 关闭弹窗确认 Hook
 */
export function useCloseDialog({ onClose, t }: UseCloseDialogParams) {
  /**
   * 关闭弹框确认
   * 弹出确认框，确认后关闭弹窗
   */
  const closeDialog = useCallback(() => {
    confirm({
      title: t('confirmClose.title'),
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      content: t('confirmClose.content'),
      okType: 'destructive',
      centered: true,
      cancelText: t('buttons.cancel'),
      onOk() {
        onClose()
      },
    })
  }, [onClose, t])

  return {
    closeDialog,
  }
}
