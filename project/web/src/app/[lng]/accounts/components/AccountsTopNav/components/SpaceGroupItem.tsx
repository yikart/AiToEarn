import type { SocialAccount } from '@/api/types/account.type'
import type { AccountGroup } from '@/store/account'
import { DownOutlined, RightOutlined, UpOutlined } from '@ant-design/icons'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import AccountItem from './AccountItem'

interface SpaceGroupItemProps {
  group: AccountGroup
  accounts: SocialAccount[]
  isCollapsed: boolean
  isDefaultGroup: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  activeAccountId?: string
  sortLoading?: string | null
  deleteLoading?: string | null
  onToggleCollapse: (groupId: string) => void
  onSelectAccount: (account: SocialAccount) => void
  onGroupSort: (groupId: string, direction: 'up' | 'down') => void
}

const SpaceGroupItem = memo(({
  group,
  accounts,
  isCollapsed,
  isDefaultGroup,
  canMoveUp,
  canMoveDown,
  activeAccountId,
  sortLoading,
  deleteLoading,
  onToggleCollapse,
  onSelectAccount,
  onGroupSort,
}: SpaceGroupItemProps) => {
  const { t } = useTransClient('account')
  const isSorting = sortLoading === group.id

  return (
    <div className="mb-1">
      {/* 空间标题 - 可点击折叠 */}
      <div
        className="flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer hover:bg-muted/50"
        onClick={() => onToggleCollapse(group.id)}
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
      </div>

      {/* 频道列表 */}
      {!isCollapsed && accounts.map((account) => {
        const isActive = activeAccountId === account.id
        return (
          <AccountItem
            key={account.id}
            account={account}
            isActive={isActive}
            onSelect={onSelectAccount}
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
