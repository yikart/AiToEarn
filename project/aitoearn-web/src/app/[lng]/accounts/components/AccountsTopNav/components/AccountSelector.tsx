import type { SocialAccount } from '@/api/types/account.type'
import type { AccountGroup } from '@/store/account'
import { ChevronDown, FolderOpen, Layers, UserPlus } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getOssUrl } from '@/utils/oss'
import AccountItem from './AccountItem'
import AccountSearchBar from './AccountSearchBar'
import AllChannelsItem from './AllChannelsItem'
import SpaceGroupItem from './SpaceGroupItem'

interface AccountSelectorProps {
  accountActive?: SocialAccount
  accountList: SocialAccount[]
  accountGroupList: AccountGroup[]
  filteredAccounts: SocialAccount[]
  collapsedSpaces: Set<string>
  showSpaceGroups: boolean
  sortedGroups: AccountGroup[]
  sortLoading?: string | null
  deleteLoading?: string | null
  onAccountSelect: (account: SocialAccount | undefined) => void
  onToggleSpaceCollapse: (spaceId: string) => void
  onGroupSort: (groupId: string, direction: 'up' | 'down') => void
  searchText: string
  onSearchChange: (text: string) => void
  onAddAccount?: () => void
  // 空间选择相关
  activeSpaceId?: string
  onSpaceSelect: (spaceId: string | undefined) => void
}

const AccountSelector = memo(
  ({
    accountActive,
    accountList,
    accountGroupList,
    filteredAccounts,
    collapsedSpaces,
    showSpaceGroups,
    sortedGroups,
    sortLoading,
    deleteLoading,
    onAccountSelect,
    onToggleSpaceCollapse,
    onGroupSort,
    searchText,
    onSearchChange,
    onAddAccount,
    activeSpaceId,
    onSpaceSelect,
  }: AccountSelectorProps) => {
    const { t } = useTransClient('account')

    // 获取当前选中的空间信息
    const activeSpace = useMemo(() => {
      if (!activeSpaceId)
        return undefined
      return accountGroupList.find(g => g.id === activeSpaceId)
    }, [activeSpaceId, accountGroupList])

    return (
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="accounts-selector-trigger"
              className={cn(
                'flex items-center gap-2 px-2 md:px-3 py-2 rounded-md border border-border',
                'hover:bg-muted cursor-pointer transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'min-w-[120px] md:min-w-[200px]',
              )}
            >
              {accountActive ? (
                <>
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 shrink-0">
                    <AvatarImage
                      src={getOssUrl(accountActive.avatar)}
                      alt={accountActive.nickname}
                    />
                    <AvatarFallback>
                      {accountActive.nickname?.[0] || accountActive.account?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm text-foreground text-left">
                    {accountActive.nickname || accountActive.account}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              ) : activeSpace ? (
                <>
                  <FolderOpen className="h-6 w-6 md:h-8 md:w-8 shrink-0 text-primary" />
                  <span className="flex-1 truncate text-sm text-foreground text-left">
                    {activeSpace.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              ) : (
                <>
                  <Layers className="h-6 w-6 md:h-8 md:w-8 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground text-left">
                    {t('allChannels')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent data-testid="accounts-selector-dropdown" align="end" className="w-[360px]">
            <AccountSearchBar searchText={searchText} onSearchChange={onSearchChange} />

            <AllChannelsItem
              isActive={!accountActive && !activeSpaceId}
              onClick={() => {
                onAccountSelect(undefined)
                onSpaceSelect(undefined)
              }}
            />

            {/* 添加账号按钮 - 只在移动端显示，PC端在顶部导航栏 */}
            {onAddAccount && (
              <DropdownMenuItem
                onClick={onAddAccount}
                className="flex items-center gap-3 px-3 py-3 cursor-pointer mx-2 md:hidden"
              >
                <UserPlus className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('addAccount')}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t('addAccountDesc')}</div>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* 账号列表 - 按空间分组显示 */}
            <ScrollArea className="h-[420px]">
              {showSpaceGroups ? (
                // 多空间: 按空间分组显示,支持折叠
                sortedGroups.length > 0 ? (
                  sortedGroups.map((group) => {
                    const isCollapsed = collapsedSpaces.has(group.id)
                    const groupAccounts = filteredAccounts.filter(account =>
                      group.children.some(child => child.id === account.id),
                    )
                    const isDefaultGroup = group.isDefault
                    const currentIndex = sortedGroups.findIndex(g => g.id === group.id)
                    const canMoveUp = !isDefaultGroup && currentIndex > 0
                    const canMoveDown = !isDefaultGroup && currentIndex < sortedGroups.length - 1

                    return (
                      <SpaceGroupItem
                        key={group.id}
                        group={group}
                        accounts={groupAccounts}
                        isCollapsed={isCollapsed}
                        isDefaultGroup={isDefaultGroup}
                        canMoveUp={canMoveUp}
                        canMoveDown={canMoveDown}
                        activeAccountId={accountActive?.id}
                        activeSpaceId={activeSpaceId}
                        sortLoading={sortLoading}
                        deleteLoading={deleteLoading}
                        onToggleCollapse={onToggleSpaceCollapse}
                        onSelectAccount={onAccountSelect}
                        onGroupSort={onGroupSort}
                        onSpaceSelect={onSpaceSelect}
                      />
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    {accountList.length === 0
                      ? t('sidebar.noAccounts')
                      : t('listMode.noChannelsFound')}
                  </div>
                )
              ) // 单空间: 直接显示所有账号
                : filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => {
                    const isActive = accountActive?.id === account.id
                    return (
                      <AccountItem
                        key={account.id}
                        account={account}
                        isActive={isActive}
                        onSelect={onAccountSelect}
                      />
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    {accountList.length === 0
                      ? t('sidebar.noAccounts')
                      : t('listMode.noChannelsFound')}
                  </div>
                )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
)

AccountSelector.displayName = 'AccountSelector'

export default AccountSelector
