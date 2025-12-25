/**
 * DeleteConfirmDialog - 删除确认对话框组件
 *
 * 功能：
 * - 确认删除空间或频道
 * - 显示删除提示信息
 */

'use client'

import { LoadingOutlined } from '@ant-design/icons'
import { useTransClient } from '@/app/i18n/client'
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

interface DeleteConfirmDialogProps {
  open: boolean
  type: 'space' | 'channel'
  name: string
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  type,
  name,
  loading = false,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { t } = useTransClient('account')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('channelManager.deleteConfirm', '确认删除')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除
            {type === 'space' ? '空间' : '频道'}
            {' '}
            "
            {name}
            " 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('common.cancel', '取消')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <LoadingOutlined className="h-4 w-4 mr-2 animate-spin" />
                删除中...
              </>
            ) : (
              t('common.confirm', '确认')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
