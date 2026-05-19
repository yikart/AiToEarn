/**
 * CreateSpaceSection - 新建空间部分组件
 *
 * 功能：
 * - 显示新建空间的输入框和按钮
 * - 处理新建空间的逻辑
 */

'use client'

import { Loader2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { createAccountGroupApi } from '@/api/account'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

interface CreateSpaceSectionProps {
  onSpaceCreated: () => void
}

export function CreateSpaceSection({ onSpaceCreated }: CreateSpaceSectionProps) {
  const { t } = useTransClient('account')
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [creatingSpace, setCreatingSpace] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')

  // 添加新空间
  const addNewSpace = useCallback(async () => {
    if (!newSpaceName.trim())
      return

    setCreatingSpace(true)
    try {
      await createAccountGroupApi({ name: newSpaceName.trim() })
      await onSpaceCreated()
      toast.success(t('channelManager.createSpaceSuccess', '创建空间成功'))
      setNewSpaceName('')
      setCreatingSpace(false)
      setShowCreateSpace(false)
    }
    catch (error) {
      toast.error(t('channelManager.createSpaceFailed', '创建空间失败'))
      setCreatingSpace(false)
      // 注意：这里不重置showCreateSpace，让用户可以重试
    }
  }, [newSpaceName, onSpaceCreated, t])

  return (
    <div className="flex min-w-0 gap-2 p-px">
      {showCreateSpace ? (
        <>
          <Input
            data-testid="cm-create-space-input"
            placeholder={t('channelManager.createSpaceNamePlaceholder', '输入空间名称')}
            value={newSpaceName}
            onChange={e => setNewSpaceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
                addNewSpace()
              if (e.key === 'Escape') {
                setNewSpaceName('')
                setShowCreateSpace(false)
              }
            }}
            disabled={creatingSpace}
            autoFocus
            className="h-11 min-w-0 flex-1 rounded-lg border-border/70 bg-background"
          />
          <Button data-testid="cm-create-space-confirm" onClick={addNewSpace} size="sm" disabled={!newSpaceName.trim() || creatingSpace} className="h-11 cursor-pointer rounded-lg px-4">
            {creatingSpace ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {t('deleteConfirm.confirm')}
          </Button>
          <Button
            data-testid="cm-create-space-cancel"
            variant="outline"
            onClick={() => {
              setNewSpaceName('')
              setShowCreateSpace(false)
            }}
            size="sm"
            className="h-11 cursor-pointer rounded-lg px-4"
          >
            {t('deleteConfirm.cancel')}
          </Button>
        </>
      ) : (
        <Button
          data-testid="cm-create-space-btn"
          variant="outline"
          onClick={() => setShowCreateSpace(true)}
          className="h-11 w-full max-w-[166px] cursor-pointer justify-center rounded-lg border-dashed border-primary/50 bg-background px-5 font-semibold text-primary shadow-sm hover:border-primary/70 hover:bg-primary/5 hover:text-primary"
          disabled={showCreateSpace}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('channelManager.createSpace')}
        </Button>
      )}
    </div>
  )
}
