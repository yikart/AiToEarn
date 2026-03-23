/**
 * LowBalanceAlert - 余额不足提示弹窗
 *
 * 功能描述: 当用户余额低于阈值时显示，提供不再提示和取消选项
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface LowBalanceAlertProps {
  /** 弹窗是否打开 */
  open: boolean
  /** 关闭弹窗回调（点击取消或关闭按钮） */
  onClose: () => void
  /** 点击"不再提示"回调 */
  onNeverRemind: () => void
  /** 当前语言 */
  lng: string
}

export function LowBalanceAlert({ open, onClose, onNeverRemind }: LowBalanceAlertProps) {
  const { t } = useTransClient('common')

  // 处理"不再提示"
  const handleNeverRemind = () => {
    onNeverRemind()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t('lowBalanceAlert.title')}
          </DialogTitle>
          <DialogDescription>{t('lowBalanceAlert.content')}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* 不再提示按钮 - 放在最左边 */}
          <Button variant="ghost" onClick={handleNeverRemind} className="sm:mr-auto cursor-pointer">
            {t('lowBalanceAlert.neverRemind')}
          </Button>
          {/* 取消按钮 */}
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            {t('actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LowBalanceAlert
