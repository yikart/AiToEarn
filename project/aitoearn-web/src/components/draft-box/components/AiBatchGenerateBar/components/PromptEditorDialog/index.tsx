/**
 * PromptEditorDialog - 提示词编辑弹框
 * 为长提示词提供更大的编辑区域，保存后同步回内联输入栏
 */

'use client'

import type { ClipboardEventHandler } from 'react'
import type { MediaMentionItem } from '../MediaMentionPromptInput'
import { memo, useCallback, useRef, useState } from 'react'
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
import { cn } from '@/utils/className'
import MediaMentionPromptInput from '../MediaMentionPromptInput'
import styles from './PromptEditorDialog.module.scss'

interface PromptEditorDialogProps {
  open: boolean
  value: string
  placeholder: string
  maxLength: number
  enableMediaMention?: boolean
  mediaMentions?: MediaMentionItem[]
  missingMediaLabel: string
  emptyMediaLabel: string
  emptyMediaHintLabel: string
  loadingLabel: string
  uploadMediaLabel: string
  onOpenChange: (open: boolean) => void
  onSave: (value: string) => void
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>
  onPasteFiles?: (files: FileList) => void
  onRequestUpload?: () => void
}

const PromptEditorDialog = memo(({
  open,
  value,
  placeholder,
  maxLength,
  enableMediaMention = false,
  mediaMentions = [],
  missingMediaLabel,
  emptyMediaLabel,
  emptyMediaHintLabel,
  loadingLabel,
  uploadMediaLabel,
  onOpenChange,
  onSave,
  onPaste,
  onPasteFiles,
  onRequestUpload,
}: PromptEditorDialogProps) => {
  const { t } = useTransClient('brandPromotion')
  const { t: tCommon } = useTransClient('common')
  const [draftValue, setDraftValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleOpenAutoFocus = useCallback((event: Event) => {
    event.preventDefault()

    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    const cursorPosition = textarea.value.length
    textarea.focus()
    textarea.setSelectionRange(cursorPosition, cursorPosition)
  }, [])

  const handleSave = useCallback(() => {
    onSave(draftValue)
    onOpenChange(false)
  }, [draftValue, onOpenChange, onSave])

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(styles.content, 'sm:w-[min(760px,95vw)]')}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>{t('detail.promptEditorTitle')}</DialogTitle>
          <DialogDescription>{t('detail.promptEditorDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            {enableMediaMention
              ? (
                  <MediaMentionPromptInput
                    testId="draftbox-ai-prompt-dialog-input"
                    value={draftValue}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    mediaMentions={mediaMentions}
                    onChange={setDraftValue}
                    onPasteFiles={onPasteFiles}
                    onRequestUpload={onRequestUpload}
                    autoFocus
                    minRows={12}
                    missingMediaLabel={missingMediaLabel}
                    emptyMediaLabel={emptyMediaLabel}
                    emptyMediaHintLabel={emptyMediaHintLabel}
                    loadingLabel={loadingLabel}
                    uploadMediaLabel={uploadMediaLabel}
                    editorClassName={cn(styles.textarea, 'text-sm leading-6')}
                    placeholderClassName="p-5 text-sm leading-6"
                  />
                )
              : (
                  <Textarea
                    ref={textareaRef}
                    data-testid="draftbox-ai-prompt-dialog-input"
                    value={draftValue}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={12}
                    onPaste={onPaste}
                    onChange={event => setDraftValue(event.target.value)}
                    className={cn(styles.textarea, 'text-sm leading-6')}
                  />
                )}
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
