/**
 * useNewWork Hook
 *
 * 功能描述: 统一处理"新建作品"逻辑，包括账户检查、默认账号选择、发布弹窗打开
 */

import type { RefObject } from 'react'
import type { SocialAccount } from '@/api/types/account.type'
import type { IPublishDialogRef } from '@/components/PublishDialog'
import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AccountStatus } from '@/app/config/accountConfig'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { confirm } from '@/lib/confirm'
import { useAccountStore } from '@/store/account'

export interface UseNewWorkOptions {
  /** 发布弹窗 ref */
  publishDialogRef?: RefObject<IPublishDialogRef | null>
  /** 设置发布弹窗打开状态 */
  setPublishDialogOpen: (open: boolean) => void
  /** 设置默认选中的账号 ID 列表 */
  setDefaultAccountIds?: (ids: string[] | undefined) => void
}

export interface OpenNewWorkOptions {
  /** 指定发布日期（ISO 格式字符串） */
  date?: string
  /** 跳过账户检查，直接打开弹窗 */
  skipAccountCheck?: boolean
}

/**
 * 统一处理新建作品逻辑的 Hook
 *
 * @param options Hook 配置选项
 * @returns 包含 openNewWork 方法的对象
 *
 * @example
 * ```tsx
 * const { openNewWork, hasUsableAccounts } = useNewWork({
 *   publishDialogRef,
 *   setPublishDialogOpen,
 *   setDefaultAccountIds,
 * })
 *
 * // 基础用法：打开新建作品弹窗
 * <Button onClick={() => openNewWork()}>新建作品</Button>
 *
 * // 带日期参数：从日历点击某天创建作品
 * <Button onClick={() => openNewWork({ date: selectedDate })}>创建</Button>
 * ```
 */
export function useNewWork(options: UseNewWorkOptions) {
  const { publishDialogRef, setPublishDialogOpen, setDefaultAccountIds } = options

  const { t } = useTransClient('account')
  const { t: tCommon } = useTransClient('common')

  // 账户相关状态
  const { accountActive, accountGroupList, activeSpaceId } = useAccountStore(
    useShallow(state => ({
      accountActive: state.accountActive,
      accountGroupList: state.accountGroupList,
      activeSpaceId: state.activeSpaceId,
    })),
  )

  // 频道管理器
  const { openConnectList } = useChannelManagerStore(
    useShallow(state => ({
      openConnectList: state.openConnectList,
    })),
  )

  // 获取所有账号列表（扁平化）
  const allAccounts = useMemo(() => {
    return accountGroupList.reduce<SocialAccount[]>((acc, group) => {
      return [...acc, ...group.children]
    }, [])
  }, [accountGroupList])

  // 是否有可用账户
  const hasUsableAccounts = useMemo(() => {
    return allAccounts.some(account => account.status === AccountStatus.USABLE)
  }, [allAccounts])

  // 根据选中空间计算默认选中的账号ID列表（过滤离线账号）
  const spaceDefaultAccountIds = useMemo(() => {
    if (!activeSpaceId)
      return undefined

    const space = accountGroupList.find(g => g.id === activeSpaceId)
    if (!space)
      return undefined

    // 过滤在线账号
    const onlineAccountIds = space.children
      .filter(account => account.status === AccountStatus.USABLE)
      .map(account => account.id)

    return onlineAccountIds.length > 0 ? onlineAccountIds : undefined
  }, [activeSpaceId, accountGroupList])

  /**
   * 计算默认选中的账号 ID 列表
   * 优先级：
   * 1. 当前选中的单个账号（如果在线）
   * 2. 当前选中空间下的在线账号
   * 3. 所有在线账号
   */
  const getDefaultAccountIds = useCallback((): string[] | undefined => {
    // 1. 如果选中了单个账号，优先使用该账号
    if (accountActive && accountActive.status === AccountStatus.USABLE) {
      return [accountActive.id]
    }

    // 2. 如果选中了空间，使用该空间下的在线账号
    if (spaceDefaultAccountIds) {
      return spaceDefaultAccountIds
    }

    // 3. "全部频道" - 默认选择所有在线账号
    const allOnlineAccountIds = allAccounts
      .filter(account => account.status === AccountStatus.USABLE)
      .map(account => account.id)

    return allOnlineAccountIds.length > 0 ? allOnlineAccountIds : undefined
  }, [accountActive, spaceDefaultAccountIds, allAccounts])

  /**
   * 打开新建作品弹窗
   * 会自动检查账户状态，设置默认账号，并打开弹窗
   */
  const openNewWork = useCallback(
    (workOptions?: OpenNewWorkOptions) => {
      const { date, skipAccountCheck = false } = workOptions || {}

      // 检查是否有可用账户
      if (!skipAccountCheck && !hasUsableAccounts) {
        // 使用 confirm 弹窗提示用户先添加账号
        confirm({
          title: t('noAccountWarning.title'),
          content: t('noAccountWarning.content'),
          okText: t('noAccountWarning.addAccount'),
          cancelText: tCommon('actions.cancel'),
          okType: 'default',
          onOk: async () => {
            // 打开频道管理器连接频道列表
            openConnectList()
          },
        })
        return
      }

      // 设置默认选中的账号
      if (setDefaultAccountIds) {
        const defaultIds = getDefaultAccountIds()
        setDefaultAccountIds(defaultIds)
      }

      // 如果指定了日期，设置发布时间
      if (date && publishDialogRef?.current) {
        publishDialogRef.current.setPubTime(date)
      }

      // 打开发布弹窗
      setPublishDialogOpen(true)
    },
    [
      hasUsableAccounts,
      t,
      tCommon,
      openConnectList,
      setDefaultAccountIds,
      getDefaultAccountIds,
      publishDialogRef,
      setPublishDialogOpen,
    ],
  )

  return {
    /** 打开新建作品弹窗 */
    openNewWork,
    /** 是否有可用账户 */
    hasUsableAccounts,
    /** 所有账号列表 */
    allAccounts,
    /** 获取默认选中的账号 ID 列表 */
    getDefaultAccountIds,
  }
}
