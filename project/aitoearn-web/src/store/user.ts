import i18next from 'i18next'
import lodash from 'lodash'
import { getUserInfoApi } from '@/api/apiReq'
import { getCreditsBalanceApi } from '@/api/credits'
import { createPersistStore } from '@/utils/createPersistStore'
import { useAccountStore } from '.'

export enum UserType {
  CREATOR = 'CREATOR', // 创作者
  BUSINESS_OWNER = 'BUSINESS_OWNER', // 餐厅老板/商家
}

export interface UserInfo {
  createdAt: string
  id: string
  name: string
  password: string
  phone?: string
  mail: string
  salt: string
  status: number
  updateTime: string
  _id: string
  avatar?: string
  score?: number
  income?: number // 余额字段
  popularizeCode?: string
  placeId?: string
  // 用户身份
  userType: UserType
}

export interface IUserStore {
  token?: string
  // 用户信息
  userInfo?: Partial<UserInfo>
  // 添加账户是否默认开启代理
  isAddAccountPorxy: boolean
  // 语言
  lang: string
  // Credits 余额（美分）
  creditsBalance: number
  // Credits 余额加载状态
  creditsLoading: boolean
  // Credits 余额是否已初始化（用于判断是否可以依赖余额数据）
  creditsInitialized: boolean
  // 侧边栏收起状态
  sidebarCollapsed: boolean
  // 默认品牌推广计划 ID（缓存）
  defaultPlanId?: string
  // 是否曾经登录过（用于判断是否显示登录页或重定向到注册页）
  hasEverLoggedIn: boolean
  // ISO alpha-2 国家代码（如 "SG"、"US"）
  countryCode?: string
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  isAddAccountPorxy: false,
  lang: i18next.language || 'en',
  creditsBalance: 0,
  creditsLoading: false,
  creditsInitialized: false,
  sidebarCollapsed: false,
  defaultPlanId: undefined,
  hasEverLoggedIn: false,
  countryCode: undefined,
}

function getState(): IUserStore {
  return lodash.cloneDeep(state)
}

export const useUserStore = createPersistStore(
  {
    ...getState(),
  },
  (set, _get) => {
    const methods = {
      // 设置语言
      setLang(lang: string) {
        set({
          lang,
        })
      },
      setIsAddAccountPorxy(isAddAccountPorxy: boolean) {
        set({ isAddAccountPorxy })
      },
      setToken: (token: string) => {
        // 登录时重置余额初始化状态，确保重新获取
        set({ token, hasEverLoggedIn: true, creditsInitialized: false })
        // 立即获取余额
        methods.fetchCreditsBalance()
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo })
      },

      appInit() {
        set({ creditsInitialized: false }) // 防御性重置，确保等 API 返回后再判定余额
        methods.getUserInfo()
        methods.fetchCreditsBalance()
        useAccountStore.getState().accountInit()
      },

      // 获取用户信息
      async getUserInfo() {
        const res = await getUserInfoApi()
        if (res) {
          set({
            userInfo: res.data,
          })
        }
      },

      // 获取 Credits 余额
      async fetchCreditsBalance() {
        const token = _get().token
        // 未登录时不调用 API，也不设置 creditsInitialized
        if (!token) {
          return
        }

        set({ creditsLoading: true })
        try {
          const res = await getCreditsBalanceApi()
          if (res?.data) {
            set({ creditsBalance: res.data.balance, creditsInitialized: true })
          }
        }
        finally {
          set({ creditsLoading: false })
        }
      },

      // 设置 Credits 余额
      setCreditsBalance(balance: number) {
        set({ creditsBalance: balance })
      },

      // 设置侧边栏收起状态
      setSidebarCollapsed(collapsed: boolean) {
        set({ sidebarCollapsed: collapsed })
      },

      // 设置默认品牌推广计划 ID
      setDefaultPlanId(planId: string | undefined) {
        set({ defaultPlanId: planId })
      },

      // 清除登录状态（保留 hasEverLoggedIn 标记）
      clearLoginStatus: () => {
        const hasEverLoggedIn = _get().hasEverLoggedIn
        set({ ...getState(), hasEverLoggedIn })
        useAccountStore.getState().clear()
      },

      // 登出
      logout() {
        methods.clearLoginStatus()
        window.location.href = '/'
      },
    }

    return methods
  },
  {
    name: 'User',
    partialize: (state) => {
      // creditsInitialized 和 creditsLoading 为运行时状态，不持久化
      // 避免页面刷新后水合恢复旧值导致 LowBalanceAlert 误弹
      const { creditsInitialized, creditsLoading, ...rest } = state
      return rest as typeof state
    },
  },
  'localStorage',
)
