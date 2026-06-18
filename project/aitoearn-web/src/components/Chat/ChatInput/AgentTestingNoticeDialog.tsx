/**
 * AgentTestingNoticeDialog - Agent 测试阶段提示弹窗
 * 功能：在 Chat 提交前提示测试阶段风险，并支持不再提示
 */

'use client'

import { useEffect, useId, useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'

interface AgentTestingNoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (doNotShowAgain: boolean) => void
}

export function AgentTestingNoticeDialog({
  open,
  onOpenChange,
  onConfirm,
}: AgentTestingNoticeDialogProps) {
  const { t } = useTransClient('chat')
  const checkboxId = useId()
  const [doNotShowAgain, setDoNotShowAgain] = useState(false)

  useEffect(() => {
    if (open) {
      setDoNotShowAgain(false)
    }
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="min-h-0 max-w-[520px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            {t('agentNotice.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
            {t('agentNotice.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
        >
          <Checkbox
            id={checkboxId}
            checked={doNotShowAgain}
            onCheckedChange={checked => setDoNotShowAgain(checked === true)}
          />
          <span>{t('agentNotice.doNotShowAgain')}</span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('agentNotice.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(doNotShowAgain)}>
            {t('agentNotice.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
