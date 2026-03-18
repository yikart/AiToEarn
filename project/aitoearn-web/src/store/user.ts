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
  // 添加账户是否默认开启代理
  isAddAccountPorxy: boolean
  // 语言
  lang: string
  // 侧边栏收起状态
  sidebarCollapsed: boolean
  // 是否曾经登录过（用于判断是否显示登录页或重定向到注册页）
  hasEverLoggedIn: boolean
  // appInit 是否已完成（用于路由守卫等待自动登录）
  _appInitialized: boolean
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  isAddAccountPorxy: false,
  lang: i18next.language || 'en',
  sidebarCollapsed: false,
  hasEverLoggedIn: false,
  _appInitialized: false,
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
        set({ token, hasEverLoggedIn: true })
      },
      setUserInfo: (userInfo: UserInfo) => {
        set({ userInfo })
      },

      async appInit() {
        // 自动登录：从 init 服务生成的 token 文件中获取
        if (!_get().token) {
          try {
            const res = await fetch('/auto-login')
            const data = await res.json()
            if (data.token) methods.setToken(data.token)
          } catch {}
        }
        set({ _appInitialized: true })
        methods.getUserInfo()
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
  },
  'localStorage',
)
