/**
 * AccountsTopNav 组件
 *
 * 功能描述: 账号模块顶部导航栏
 * - 左侧: "新建作品"按钮 + 添加账号
 * - 右侧: 空间+频道融合选择器(支持按空间分组显示频道,可折叠)
 */

'use client'

import type { SocialAccount } from '@/api/types/account.type'
import { Bot, SquarePen, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { apiUpdateAccountGroupSortRank } from '@/api/accountSort'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import AccountSelector from './components/AccountSelector'

export interface IAccountsTopNavProps {
  onNewWork?: () => void
  onAddAccount?: () => void
}

const AccountsTopNav = memo<IAccountsTopNavProps>(({ onNewWork, onAddAccount }) => {
  const { t } = useTransClient('account')
  const router = useRouter()
  const [accountSearchText, setAccountSearchText] = useState('')
  const [collapsedSpaces, setCollapsedSpaces] = useState<Set<string>>(new Set())
  const [sortLoading, setSortLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const {
    accountList,
    accountActive,
    setAccountActive,
    accountGroupList,
    getAccountGroup,
    activeSpaceId,
    setActiveSpaceId,
  } = useAccountStore(
    useShallow(state => ({
      accountList: state.accountList,
      accountActive: state.accountActive,
      setAccountActive: state.setAccountActive,
      accountGroupList: state.accountGroupList,
      getAccountGroup: state.getAccountGroup,
      activeSpaceId: state.activeSpaceId,
      setActiveSpaceId: state.setActiveSpaceId,
    })),
  )

  // 根据搜索文本筛选账户（不过滤离线账号）
  const filteredAccounts = useMemo(
    () =>
      accountList.filter(
        account =>
          account.nickname?.toLowerCase().includes(accountSearchText.toLowerCase())
          || account.account?.toLowerCase().includes(accountSearchText.toLowerCase()),
      ),
    [accountList, accountSearchText],
  )

  // 处理账户选择
  const handleAccountSelect = useCallback(
    (account: SocialAccount | undefined) => {
      setAccountActive(account)
      setAccountSearchText('') // 清空搜索
    },
    [setAccountActive],
  )

  // 处理空间选择
  const handleSpaceSelect = useCallback(
    (spaceId: string | undefined) => {
      setActiveSpaceId(spaceId)
      setAccountActive(undefined) // 选择空间时清除账号选择
      setAccountSearchText('') // 清空搜索
    },
    [setActiveSpaceId, setAccountActive],
  )

  // 处理空间排序
  const handleGroupSort = useCallback(
    async (groupId: string, direction: 'up' | 'down') => {
      setSortLoading(groupId)
      try {
        const sortedGroups = [...accountGroupList].sort((a, b) => (a.rank || 0) - (b.rank || 0))
        const currentIndex = sortedGroups.findIndex(g => g.id === groupId)

        if (currentIndex === -1) {
          setSortLoading(null)
          return
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (newIndex < 0 || newIndex >= sortedGroups.length) {
          setSortLoading(null)
          return
        }

        // 交换位置
        ;[sortedGroups[currentIndex], sortedGroups[newIndex]] = [
          sortedGroups[newIndex],
          sortedGroups[currentIndex],
        ]

        // 更新rank
        const updateList = sortedGroups.map((group, index) => ({
          id: group.id,
          rank: index,
        }))

        await apiUpdateAccountGroupSortRank({ list: updateList })
        await getAccountGroup()
        toast.success(t('messages.sortSuccess'))
      }
      catch (error) {
        toast.error(t('messages.sortFailed'))
      }
      finally {
        setSortLoading(null)
      }
    },
    [accountGroupList, getAccountGroup, t],
  )

  // 切换空间折叠状态
  const toggleSpaceCollapse = useCallback((spaceId: string) => {
    setCollapsedSpaces((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(spaceId)) {
        newSet.delete(spaceId)
      }
      else {
        newSet.add(spaceId)
      }
      return newSet
    })
  }, [])

  // 显示空间分组的条件
  const showSpaceGroups = accountGroupList.length > 1

  // 获取排序后的空间列表
  const sortedGroups = useMemo(() => {
    return [...accountGroupList].sort((a, b) => (a.rank || 0) - (b.rank || 0))
  }, [accountGroupList])

  return (
    <>
      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 border-b bg-background shrink-0">
        {/* 左侧: 操作按钮区域 */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* 新建作品按钮 - 移动端显示文字，因为添加账号按钮移到下拉菜单了 */}
          <Button
            data-testid="accounts-new-work-btn"
            onClick={onNewWork}
            className="h-8 md:h-9 gap-1 md:gap-2 px-3 md:px-4 cursor-pointer"
          >
            <SquarePen className="h-4 w-4" />
            <span>{t('newWork')}</span>
          </Button>

          <div className="border-l border-border h-6 mx-1 md:mx-2 hidden md:block" />

          {/* 添加账号按钮 - 只在PC端显示，移动端在下拉菜单中 */}
          <Button
            data-testid="accounts-add-account-btn"
            variant="outline"
            onClick={onAddAccount}
            className="h-8 md:h-9 gap-1 md:gap-2 px-2 md:px-4 cursor-pointer hidden md:flex"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('addAccount')}</span>
          </Button>

          <div className="border-l border-border h-6 mx-1 md:mx-2" />

          {/* Agent创建按钮 */}
          <Button
            variant="outline"
            onClick={() => router.push('/ai-social')}
            className="h-8 md:h-9 gap-1 md:gap-2 px-2 md:px-4 cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>{t('agentCreate')}</span>
          </Button>
        </div>

        {/* 右侧: 频道选择器(按空间分组) */}
        <AccountSelector
          accountActive={accountActive}
          accountList={accountList}
          accountGroupList={accountGroupList}
          filteredAccounts={filteredAccounts}
          collapsedSpaces={collapsedSpaces}
          showSpaceGroups={showSpaceGroups}
          sortedGroups={sortedGroups}
          sortLoading={sortLoading}
          deleteLoading={deleteLoading}
          onAccountSelect={handleAccountSelect}
          onToggleSpaceCollapse={toggleSpaceCollapse}
          onGroupSort={handleGroupSort}
          searchText={accountSearchText}
          onSearchChange={setAccountSearchText}
          onAddAccount={onAddAccount}
          activeSpaceId={activeSpaceId}
          onSpaceSelect={handleSpaceSelect}
        />
      </div>
    </>
  )
})

AccountsTopNav.displayName = 'AccountsTopNav'

export default AccountsTopNav
