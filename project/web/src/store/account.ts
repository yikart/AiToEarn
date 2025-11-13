import type { AccountGroupItem, SocialAccount } from '@/api/types/account.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getAccountGroupApi, getAccountListApi } from '@/api/account'
import { directTrans } from '@/app/i18n/client'
import { useUserStore } from '@/store/user'

export interface AccountGroup extends AccountGroupItem {
  children: SocialAccount[]
}

export interface IAccountStore {
  accountList: SocialAccount[]
  accountMap: Map<string, SocialAccount>
  // key=account,value=账户
  accountAccountMap: Map<string, SocialAccount>
  accountGroupList: AccountGroup[]
  accountGroupMap: Map<string, AccountGroup>
  accountLoading: boolean
  // 当前选择的账户
  accountActive?: SocialAccount
}

const store: IAccountStore = {
  // 不分组的账户数据
  accountList: [],
  // 分组的账户数据
  accountGroupList: [],
  accountGroupMap: new Map([]),
  accountMap: new Map([]),
  accountAccountMap: new Map([]),
  accountLoading: false,
  accountActive: undefined,
}

function getStore() {
  return lodash.cloneDeep(store)
}

// 视频发布所有组件的共享状态和方法
export const useAccountStore = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
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

        setAccountGroupList(accountGroupList: AccountGroup[]) {
          set({ accountGroupList })
        },

        /**
         * 异步获取账户列表（含稳健的loading与错误处理），避免阻塞UI
         */
        async getAccountList() {
          if (get().accountLoading)
            return
          set({ accountLoading: true })

          try {
            const accountMap = new Map<string, SocialAccount>([])
            const accountAccountMap = new Map<string, SocialAccount>([])

            // 防卡死：给请求增加超时兜底（例如 15s），即使后端迟迟不返回也不会一直占用loading
            const timeoutMs = 10000
            const timeoutPromise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({ code: -1, data: [] }), timeoutMs)
            })
            const result = await Promise.race([
              getAccountListApi(),
              timeoutPromise,
            ])

            if (result?.code !== 0)
              return

            const accountList: SocialAccount[] = []
            for (const item of result.data) {
              accountMap.set(item.id, item)
              accountAccountMap.set(item.account, item)
              accountList.push(item)
            }

            set({
              accountList,
              accountMap,
              accountAccountMap,
            })

            // 后续分组数据获取不阻塞调用方
            methods.getAccountGroup()
          }
          finally {
            set({ accountLoading: false })
          }
        },

        /**
         * 后台异步启动账户列表加载（不等待，不阻塞首屏/刷新渲染）
         */
        getAccountListInBackground() {
          // fire-and-forget，内部自行处理loading与错误
          void methods.getAccountList()
        },

        // 获取用户组的数据并且将用户放到对应组下
        async getAccountGroup() {
          const res = await getAccountGroupApi()
          const groupList = res?.data

          if (!groupList)
            return
          if (groupList.length === 0)
            return
          groupList.map((v: any) => {
            v.name = v.isDefault
              ? directTrans('account', 'defaultSpace')
              : v.name
          })

          const accountGroupList: AccountGroup[] = []
          // key=组ID，val=账户ID
          const accountGroupMap = new Map<string, AccountGroup>()

          const defaultGroup = groupList.find((v: any) => v.isDefault)!

          groupList.map((v: any) => {
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
            else {
              accountGroupMap.get(defaultGroup.id)!.children?.push(v)
              v.groupId = defaultGroup.id
            }
          })

          accountGroupList.sort((a, b) => {
            return a.rank - b.rank
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
