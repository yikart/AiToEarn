import type { SocialAccount } from '@/api/types/account.type'
import type { AccountGroup } from '@/store/account'
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { Check } from 'lucide-react'
import { memo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import AccountItem from './AccountItem'

interface SpaceGroupItemProps {
  group: AccountGroup
  accounts: SocialAccount[]
  isCollapsed: boolean
  isDefaultGroup: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  activeAccountId?: string
  /** 当前选中的空间 ID */
  activeSpaceId?: string
  sortLoading?: string | null
  deleteLoading?: string | null
  onToggleCollapse: (groupId: string) => void
  onSelectAccount: (account: SocialAccount) => void
  onGroupSort: (groupId: string, direction: 'up' | 'down') => void
  /** 选择空间的回调 */
  onSpaceSelect?: (spaceId: string | undefined) => void
}

const SpaceGroupItem = memo(
  ({
    group,
    accounts,
    isCollapsed,
    isDefaultGroup,
    canMoveUp,
    canMoveDown,
    activeAccountId,
    activeSpaceId,
    sortLoading,
    deleteLoading,
    onToggleCollapse,
    onSelectAccount,
    onGroupSort,
    onSpaceSelect,
  }: SpaceGroupItemProps) => {
    const { t } = useTransClient('account')
    const isSorting = sortLoading === group.id
    const isSpaceActive = activeSpaceId === group.id

    // 点击空间名称区域 - 选择/取消选择空间
    const handleSpaceClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onSpaceSelect) {
        // 如果已选中，取消选择；否则选择该空间
        onSpaceSelect(isSpaceActive ? undefined : group.id)
      }
    }

    // 点击箭头 - 展开/折叠
    const handleToggleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleCollapse(group.id)
    }

    // 右键点击 - 展开/折叠
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onToggleCollapse(group.id)
    }

    return (
      <div className="mb-1">
        {/* 空间标题行 */}
        <div
          data-testid="accounts-selector-space-group"
          className={cn(
            'flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer',
            isSpaceActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50',
          )}
          onClick={handleSpaceClick}
          onContextMenu={handleContextMenu}
        >
          {/* 箭头区域 - 点击展开/折叠 */}
          <div className="p-0.5 rounded hover:bg-muted" onClick={handleToggleClick}>
            {isCollapsed ? (
              <RightOutlined className="text-xs text-muted-foreground" />
            ) : (
              <DownOutlined className="text-xs text-muted-foreground" />
            )}
          </div>

          {/* 空间名称 */}
          <span
            className={cn(
              'text-xs font-semibold flex-1',
              isSpaceActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {group.name || t('defaultSpace')}
          </span>

          {/* 选中图标 */}
          {isSpaceActive && <Check className="w-4 h-4 text-primary" />}

          {/* 账号数量 */}
          <span className="text-xs text-muted-foreground">{accounts.length}</span>
        </div>

        {/* 频道列表 */}
        {!isCollapsed
          && accounts.map((account) => {
            const isActive = activeAccountId === account.id
            return (
              <AccountItem
                key={account.id}
                account={account}
                isActive={isActive}
                onSelect={onSelectAccount}
                indent
              />
            )
          })}
      </div>
    )
  },
)

SpaceGroupItem.displayName = 'SpaceGroupItem'

export default SpaceGroupItem
