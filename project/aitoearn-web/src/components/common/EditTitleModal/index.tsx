/**
 * EditTitleModal - 编辑标题弹窗组件
 * 功能：编辑任务标题，支持字数限制和回车提交
 */

'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'

export interface IEditTitleModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 当前标题 */
  currentTitle: string
  /** 保存回调 */
  onSave: (title: string) => Promise<void>
  /** 最大字数限制 */
  maxLength?: number
}

/** 内部内容组件 */
const ModalContent = memo(
  ({ onOpenChange, currentTitle, onSave, maxLength = 100 }: Omit<IEditTitleModalProps, 'open'>) => {
    const { t } = useTransClient('chat')
    const [title, setTitle] = useState(currentTitle)
    const [isLoading, setIsLoading] = useState(false)

    // 当 currentTitle 变化时更新内部状态
    useEffect(() => {
      setTitle(currentTitle)
    }, [currentTitle])

    const handleSave = useCallback(async () => {
      const trimmedTitle = title.trim()
      if (!trimmedTitle || isLoading)
        return

      setIsLoading(true)
      try {
        await onSave(trimmedTitle)
        onOpenChange(false)
      }
      finally {
        setIsLoading(false)
      }
    }, [title, isLoading, onSave, onOpenChange])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSave()
        }
      },
      [handleSave],
    )

    const handleClose = useCallback(() => {
      onOpenChange(false)
    }, [onOpenChange])

    return (
      <Modal
        open
        title={t('task.editTitle')}
        onCancel={handleClose}
        onOk={handleSave}
        confirmLoading={isLoading}
        okText={t('rating.submit')}
        cancelText={t('rating.cancel')}
        width={400}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t('task.titleLabel')}</Label>
            <Input
              id="task-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('task.titlePlaceholder')}
              maxLength={maxLength}
              autoFocus
            />
            <div className="text-xs text-muted-foreground text-right">
              {title.length}
              {' '}
              /
              {maxLength}
            </div>
          </div>
        </div>
      </Modal>
    )
  },
)

/**
 * EditTitleModal - 编辑标题弹窗
 * 使用两层组件模式避免动态加载 namespace 导致闪烁
 */
export function EditTitleModal({ open, ...props }: IEditTitleModalProps) {
  // 只在打开时渲染内部组件，避免动态加载 namespace 导致闪烁
  if (!open)
    return null

  return <ModalContent {...props} />
}

export default EditTitleModal
