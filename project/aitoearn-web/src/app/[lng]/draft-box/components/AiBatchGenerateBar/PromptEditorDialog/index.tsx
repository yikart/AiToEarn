/**
 * PromptEditorDialog - 提示词编辑弹框
 * 为长提示词提供更大的编辑区域，保存后同步回内联输入栏
 */

'use client'

import type { ClipboardEventHandler } from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import styles from './PromptEditorDialog.module.scss'

interface PromptEditorDialogProps {
  open: boolean
  value: string
  placeholder: string
  maxLength: number
  onOpenChange: (open: boolean) => void
  onSave: (value: string) => void
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>
}

const PromptEditorDialog = memo(({
  open,
  value,
  placeholder,
  maxLength,
  onOpenChange,
  onSave,
  onPaste,
}: PromptEditorDialogProps) => {
  const { t } = useTransClient('brandPromotion')
  const { t: tCommon } = useTransClient('common')
  const [draftValue, setDraftValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setDraftValue(value)
    }
  }, [open, value])

  useEffect(() => {
    if (!open) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) {
        return
      }

      const cursorPosition = textarea.value.length
      textarea.focus()
      textarea.setSelectionRange(cursorPosition, cursorPosition)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open, draftValue])

  const handleSave = useCallback(() => {
    onSave(draftValue)
    onOpenChange(false)
  }, [draftValue, onOpenChange, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(styles.content, 'sm:w-[min(760px,95vw)]')}>
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>{t('detail.promptEditorTitle')}</DialogTitle>
          <DialogDescription>{t('detail.promptEditorDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            <Textarea
              ref={textareaRef}
              data-testid="draftbox-ai-prompt-dialog-input"
              value={draftValue}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={12}
              autoFocus
              onPaste={onPaste}
              onChange={event => setDraftValue(event.target.value)}
              className={cn(styles.textarea, 'text-sm leading-6')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {draftValue.length}
            /
            {maxLength}
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleSave}
            >
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

PromptEditorDialog.displayName = 'PromptEditorDialog'

export default PromptEditorDialog
