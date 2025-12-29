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
    <div className="flex gap-2">
      {showCreateSpace ? (
        <>
          <Input
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
            className="flex-1"
          />
          <Button onClick={addNewSpace} size="sm" disabled={!newSpaceName.trim() || creatingSpace}>
            {creatingSpace ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {t('common.confirm')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setNewSpaceName('')
              setShowCreateSpace(false)
            }}
            size="sm"
          >
            {t('common.cancel')}
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowCreateSpace(true)}
          className="w-full cursor-pointer justify-start border-dashed"
          disabled={showCreateSpace}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('channelManager.createSpace')}
        </Button>
      )}
    </div>
  )
}
