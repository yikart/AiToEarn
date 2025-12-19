import type { SocialAccount } from '@/api/types/account.type'
import type { AccountGroup } from '@/store/account'
import { DeleteOutlined, DownOutlined, EllipsisOutlined, LoadingOutlined, RightOutlined, UpOutlined } from '@ant-design/icons'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import AccountItem from './AccountItem'

interface SpaceGroupItemProps {
  group: AccountGroup
  accounts: SocialAccount[]
  isCollapsed: boolean
  isDefaultGroup: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  canDelete: boolean
  activeAccountId?: string
  sortLoading?: string | null
  deleteLoading?: string | null
  onToggleCollapse: (groupId: string) => void
  onSelectAccount: (account: SocialAccount) => void
  onDeleteAccount: (account: SocialAccount) => void
  onGroupSort: (groupId: string, direction: 'up' | 'down') => void
  onGroupDelete: (group: AccountGroup) => void
}

const SpaceGroupItem = memo(({
  group,
  accounts,
  isCollapsed,
  isDefaultGroup,
  canMoveUp,
  canMoveDown,
  canDelete,
  activeAccountId,
  sortLoading,
  deleteLoading,
  onToggleCollapse,
  onSelectAccount,
  onDeleteAccount,
  onGroupSort,
  onGroupDelete,
}: SpaceGroupItemProps) => {
  const { t } = useTransClient('account')
  const isSorting = sortLoading === group.id
  const isDeletingGroup = deleteLoading === group.id

  return (
    <div className="mb-1">
      {/* 空间标题 - 可点击折叠 */}
      <DropdownMenu>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 transition-colors group relative',
            isDeletingGroup ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50',
          )}
          onClick={() => !isDeletingGroup && onToggleCollapse(group.id)}
        >
          {isCollapsed
            ? <RightOutlined className="text-xs text-muted-foreground" />
            : <DownOutlined className="text-xs text-muted-foreground" />}
          <span className="text-xs font-semibold text-muted-foreground flex-1">
            {group.name || t('defaultSpace')}
          </span>
          <span className="text-xs text-muted-foreground">
            {accounts.length}
          </span>
          {!isDefaultGroup && (
            isDeletingGroup ? (
              <div className="p-1">
                <LoadingOutlined className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded cursor-pointer"
                >
                  <EllipsisOutlined className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
            )
          )}
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onGroupSort(group.id, 'up')}
              disabled={!canMoveUp || isSorting}
            >
              {isSorting ? (
                <LoadingOutlined className="mr-2 animate-spin" />
              ) : (
                <UpOutlined className="mr-2" />
              )}
              {t('sidebar.moveUp')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGroupSort(group.id, 'down')}
              disabled={!canMoveDown || isSorting}
            >
              {isSorting ? (
                <LoadingOutlined className="mr-2 animate-spin" />
              ) : (
                <DownOutlined className="mr-2" />
              )}
              {t('sidebar.moveDown')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onGroupDelete(group)}
              disabled={!canDelete}
              className="text-destructive"
            >
              <DeleteOutlined className="mr-2" />
              {t('userManageSidebar.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>

      {/* 频道列表 */}
      {!isCollapsed && accounts.map((account) => {
        const isActive = activeAccountId === account.id
        return (
          <AccountItem
            key={account.id}
            account={account}
            isActive={isActive}
            onSelect={onSelectAccount}
            onDelete={onDeleteAccount}
            deleteLoading={deleteLoading}
            indent
          />
        )
      })}
    </div>
  )
})

SpaceGroupItem.displayName = 'SpaceGroupItem'

export default SpaceGroupItem

