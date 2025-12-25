import type { AccountGroupItem, SocialAccount } from '@/api/types/account.type'

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { memo, useEffect } from 'react'
import { useTransClient } from '@/app/i18n/client'

interface ContextMenuProps {
  open: boolean
  x: number
  y: number
  target: 'account' | 'group'
  data: SocialAccount | AccountGroupItem | null
  sortedGroups: AccountGroupItem[]
  onClose: () => void
  onAccountDelete: (account: SocialAccount) => void
  onGroupSort: (groupId: string, direction: 'up' | 'down') => void
}

const ContextMenu = memo(({
  open,
  x,
  y,
  target,
  data,
  sortedGroups,
  onClose,
  onAccountDelete,
  onGroupSort,
}: ContextMenuProps) => {
  const { t } = useTransClient('account')

  useEffect(() => {
    if (!open)
      return

    const handleClickOutside = () => {
      onClose()
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [open, onClose])

  if (!open || !data)
    return null

  return (
    <div
      className="fixed z-[9999] min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
      style={{
        left: x,
        top: y,
      }}
      onClick={e => e.stopPropagation()}
    >
      {target === 'account' && (
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-sm text-destructive cursor-pointer"
          onClick={() => {
            onAccountDelete(data as SocialAccount)
            onClose()
          }}
        >
          <Trash2 className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
      )}
      {target === 'group' && (() => {
        const group = data as AccountGroupItem
        const isDefaultGroup = group.isDefault
        const currentIndex = sortedGroups.findIndex(g => g.id === group.id)
        const canMoveUp = !isDefaultGroup && currentIndex > 0
        const canMoveDown = !isDefaultGroup && currentIndex < sortedGroups.length - 1

        return (
          <>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={() => {
                onGroupSort(group.id, 'up')
                onClose()
              }}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
              {t('sidebar.moveUp')}
            </button>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={() => {
                onGroupSort(group.id, 'down')
                onClose()
              }}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
              {t('sidebar.moveDown')}
            </button>
          </>
        )
      })()}
    </div>
  )
})

ContextMenu.displayName = 'ContextMenu'

export default ContextMenu
