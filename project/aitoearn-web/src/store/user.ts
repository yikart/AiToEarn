import i18next from 'i18next'
import lodash from 'lodash'
import { getUserInfoApi } from '@/api/apiReq'
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
  // 语言
  lang: string
  // 侧边栏收起状态
  sidebarCollapsed: boolean
  // 是否曾经登录过（用于判断是否显示登录页或重定向到注册页）
  hasEverLoggedIn: boolean
  // 是否正在尝试使用 URL query token 登录
  isQueryTokenLoginPending: boolean
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  lang: i18next.language || 'en',
  sidebarCollapsed: false,
  hasEverLoggedIn: false,
  isQueryTokenLoginPending: false,
}

function getState(): IUserStore {
  return lodash.cloneDeep(state)
}

function getQueryToken() {
  if (typeof window === 'undefined')
    return undefined

  const token = new URLSearchParams(window.location.search).get('token')?.trim()
  return token || undefined
}

function removeQueryToken() {
  if (typeof window === 'undefined')
    return

  const url = new URL(window.location.href)
  if (!url.searchParams.has('token'))
    return

  url.searchParams.delete('token')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
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
      setToken: (token: string) => {
        set({ token, hasEverLoggedIn: true })
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo })
      },

      appInit() {
        const queryToken = getQueryToken()
        if (queryToken) {
          methods.loginWithQueryToken(queryToken)
          return
        }

        methods.getUserInfo()
        useAccountStore.getState().accountInit()
      },

      // 获取用户信息
      async getUserInfo() {
        const res = await getUserInfoApi()
        if (res?.code === 0 && res.data) {
          set({
            userInfo: res.data,
          })
          return res.data
        }
      },

      // 使用 URL query token 尝试登录
      async loginWithQueryToken(queryToken: string) {
        set({ isQueryTokenLoginPending: true })

        try {
          const res = await getUserInfoApi({
            authToken: queryToken,
            skipAuthLogout: true,
            silent: true,
          })

          if (res?.code === 0 && res.data) {
            if (_get().token !== queryToken) {
              useAccountStore.getState().clear()
            }
            methods.setToken(queryToken)
            set({ userInfo: res.data })
          }
          else if (_get().token) {
            methods.getUserInfo()
          }
        }
        finally {
          removeQueryToken()
          set({ isQueryTokenLoginPending: false })
          useAccountStore.getState().accountInit()
        }
      },

      // 设置侧边栏收起状态
      setSidebarCollapsed(collapsed: boolean) {
        set({ sidebarCollapsed: collapsed })
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
      const legacyState = state as typeof state & {
        creditsBalance?: unknown
        creditsLoading?: unknown
        creditsInitialized?: unknown
      }
      const {
        isQueryTokenLoginPending: _isQueryTokenLoginPending,
        creditsBalance: _creditsBalance,
        creditsLoading: _creditsLoading,
        creditsInitialized: _creditsInitialized,
        ...rest
      } = legacyState
      return rest as unknown as typeof state
    },
  },
  'localStorage',
)
