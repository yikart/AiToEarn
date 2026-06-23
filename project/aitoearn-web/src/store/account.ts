import type { AccountGroupItem, SocialAccount } from '@/api/accounts/account.types'
import type { PluginAccountStatusMap } from '@/store/plugin/account.utils'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getAccountGroupApi, getAccountListApi } from '@/api/accounts/account.api'
import { directTrans } from '@/app/i18n/client'
import { usePluginStore } from '@/store/plugin'
import { mergePluginAccountStatus } from '@/store/plugin/account.utils'

export interface AccountGroup extends AccountGroupItem {
  children: SocialAccount[]
}

export interface IAccountStore {
  accountList: SocialAccount[]
  accountMap: Map<string, SocialAccount>
  accountGroupList: AccountGroup[]
  accountGroupMap: Map<string, AccountGroup>
  accountLoading: boolean
  accountListInitialized: boolean
  accountPluginAuthLoading: boolean
  accountPluginAuthInitialized: boolean
  // 当前选择的账户
  accountActive?: SocialAccount
  // 当前选择的空间ID
  activeSpaceId?: string
  // 余额不足弹框状态
  lowBalanceAlertOpen: boolean
}

const store: IAccountStore = {
  // 不分组的账户数据
  accountList: [],
  // 分组的账户数据
  accountGroupList: [],
  accountGroupMap: new Map([]),
  accountMap: new Map([]),
  accountLoading: false,
  accountListInitialized: false,
  accountPluginAuthLoading: false,
  accountPluginAuthInitialized: false,
  accountActive: undefined,
  activeSpaceId: undefined,
  lowBalanceAlertOpen: false,
}

let pluginAuthStatusPromise: Promise<void> | null = null

function getStore() {
  return lodash.cloneDeep(store)
}

function normalizeAccountListData(data: SocialAccount[] | { list: SocialAccount[] } | undefined) {
  if (Array.isArray(data))
    return data
  return data?.list ?? []
}

function createAccountListState(accountList: SocialAccount[]) {
  const accountMap = new Map<string, SocialAccount>()
  accountList.forEach((account) => {
    accountMap.set(account.id, account)
  })

  return {
    accountList,
    accountMap,
  }
}

function mergeAccountStateWithPluginStatus(pluginAccountStatus: PluginAccountStatusMap) {
  const accountList = useAccountStore.getState().accountList
  if (accountList.length === 0)
    return

  const mergedAccountState = mergePluginAccountStatus(accountList, pluginAccountStatus)
  const hasChange = mergedAccountState.accountList.some((account, index) => account !== accountList[index])

  if (hasChange) {
    useAccountStore.setState(mergedAccountState)
  }
}

function mergeAccountStateWithCurrentPluginStatus() {
  mergeAccountStateWithPluginStatus(usePluginStore.getState().platformAccounts)
}

// 视频发布所有组件的共享状态和方法
export const useAccountStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        setLowBalanceAlertOpen(lowBalanceAlertOpen: boolean) {
          set({
            lowBalanceAlertOpen,
          })
        },

        clear() {
          set({
            ...getStore(),
          })
        },
        // 设置选择账户ID
        setAccountActive(accountActive?: SocialAccount) {
          set({
            accountActive,
          })
        },

        // 设置选择的空间ID
        setActiveSpaceId(activeSpaceId?: string) {
          set({
            activeSpaceId,
          })
        },

        setAccountGroupList(accountGroupList: AccountGroup[]) {
          set({ accountGroupList })
        },

        /**
         * 异步获取账户列表（含稳健的loading与错误处理），避免阻塞UI
         */
        async getAccountList(isBackground = false) {
          if (get().accountLoading)
            return
          set({ accountLoading: true })

          try {
            // 防卡死：给请求增加超时兜底（例如 15s），即使后端迟迟不返回也不会一直占用loading
            const timeoutMs = 10000
            const timeoutPromise = new Promise<Awaited<ReturnType<typeof getAccountListApi>>>((resolve) => {
              setTimeout(() => resolve({ code: -1, data: { total: 0, list: [] }, message: '', url: '' }), timeoutMs)
            })
            const result = await Promise.race([getAccountListApi(), timeoutPromise])

            if (result?.code !== 0)
              return

            const accountList = normalizeAccountListData(result.data)
            set(createAccountListState(accountList))

            methods.refreshPluginAuthStatusInBackground(isBackground)

            // 后续分组数据获取不阻塞调用方
            methods.getAccountGroup()
          }
          finally {
            set({ accountLoading: false, accountListInitialized: true })
          }
        },

        /**
         * 后台异步启动账户列表加载（不等待，不阻塞首屏/刷新渲染）
         */
        async getAccountListInBackground() {
          await methods.getAccountList(true)
        },

        refreshPluginAuthStatusInBackground(isBackground = false) {
          if (get().accountPluginAuthInitialized) {
            mergeAccountStateWithCurrentPluginStatus()
            return
          }

          if (pluginAuthStatusPromise)
            return

          set({ accountPluginAuthLoading: true })

          pluginAuthStatusPromise = usePluginStore
            .getState()
            .getAccountStatusSnapshot(isBackground, { waitForPluginApi: true })
            .then(mergeAccountStateWithPluginStatus)
            .catch(() => {})
            .finally(() => {
              set({ accountPluginAuthLoading: false, accountPluginAuthInitialized: true })
              pluginAuthStatusPromise = null
            })
        },

        // 获取用户组的数据并且将用户放到对应组下
        async getAccountGroup() {
          const res = await getAccountGroupApi()
          const groupList = res?.data

          if (!groupList)
            return
          if (groupList.length === 0)
            return
          const normalizedGroupList = groupList.map(v => ({
            ...v,
            name: v.isDefault ? directTrans('account', 'defaultSpace') : v.name,
          }))

          const accountGroupList: AccountGroup[] = []
          // key=组ID，val=账户ID
          const accountGroupMap = new Map<string, AccountGroup>()

          const defaultGroup = normalizedGroupList.find(v => v.isDefault) ?? normalizedGroupList[0]

          normalizedGroupList.map((v) => {
            const accountGroupItem = {
              ...v,
              children: [],
            }
            accountGroupList.push(accountGroupItem)
            accountGroupMap.set(v.id, accountGroupItem)
          })
          get().accountList.map((v) => {
            if (accountGroupMap.get(v.groupId!)) {
              accountGroupMap.get(v.groupId!)!.children?.push(v)
            }
            else if (defaultGroup) {
              accountGroupMap.get(defaultGroup.id)!.children?.push(v)
              v.groupId = defaultGroup.id
            }
          })

          accountGroupList.sort((a, b) => {
            return (a.rank ?? 0) - (b.rank ?? 0)
          })

          set({
            accountGroupList,
            accountGroupMap,
          })
        },

        async accountInit() {
          if (get().accountList.length > 0)
            return
          // 改为后台异步拉取，避免初始化时阻塞界面
          methods.getAccountListInBackground()
        },
      }
      return methods
    },
  ),
)
