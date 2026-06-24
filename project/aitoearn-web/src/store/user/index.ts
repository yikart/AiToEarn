import i18next from 'i18next'
import lodash from 'lodash'
import { getUserInfoApi } from '@/api/auth/auth.api'
import { createPersistStore } from '@/utils/storage/createPersistStore'
import { useAccountStore } from '../account'

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
  income?: number
  popularizeCode?: string
  placeId?: string
}

export interface IUserStore {
  token?: string
  userInfo?: Partial<UserInfo>
  isAddAccountPorxy: boolean
  lang: string
  creditsBalance: number
  creditsLoading: boolean
  creditsInitialized: boolean
  seedanceCreditsBalance: number
  seedanceCreditsAvailableBalance: number
  seedanceCreditsLoading: boolean
  seedanceCreditsInitialized: boolean
  sidebarCollapsed: boolean
  defaultPlanId?: string
  hasEverLoggedIn: boolean
}

const state: IUserStore = {
  token: undefined,
  userInfo: {},
  isAddAccountPorxy: false,
  lang: i18next.language || 'en',
  creditsBalance: 0,
  creditsLoading: false,
  creditsInitialized: false,
  seedanceCreditsBalance: 0,
  seedanceCreditsAvailableBalance: 0,
  seedanceCreditsLoading: false,
  seedanceCreditsInitialized: false,
  sidebarCollapsed: false,
  defaultPlanId: undefined,
  hasEverLoggedIn: false,
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
      setLang(lang: string) {
        set({ lang })
      },
      setIsAddAccountPorxy(isAddAccountPorxy: boolean) {
        set({ isAddAccountPorxy })
      },
      setToken(token: string) {
        set({
          token,
          hasEverLoggedIn: true,
          creditsInitialized: false,
          seedanceCreditsInitialized: false,
        })
      },
      setUserInfo(userInfo: UserInfo) {
        set({ userInfo })
      },
      appInit(autoLoginToken?: string) {
        if (!_get().token && autoLoginToken) {
          methods.setToken(autoLoginToken)
        }
        methods.getUserInfo()
        useAccountStore.getState().accountInit()
      },
      async getUserInfo() {
        const res = await getUserInfoApi()
        if (res?.code === 0 && res.data) {
          set({ userInfo: res.data })
          return res.data
        }
      },
      async fetchCreditsBalance() {
        set({ creditsInitialized: true })
      },
      setCreditsBalance(balance: number) {
        set({ creditsBalance: balance, creditsInitialized: true })
      },
      fetchSeedanceCreditsBalance() {
        const balance = _get().creditsBalance
        set({
          seedanceCreditsBalance: balance,
          seedanceCreditsAvailableBalance: balance,
          seedanceCreditsInitialized: true,
        })
      },
      setSeedanceCreditsBalance(balance: number) {
        set({
          seedanceCreditsBalance: balance,
          seedanceCreditsAvailableBalance: balance,
          seedanceCreditsInitialized: true,
        })
      },
      setSidebarCollapsed(collapsed: boolean) {
        set({ sidebarCollapsed: collapsed })
      },
      setDefaultPlanId(planId: string | undefined) {
        set({ defaultPlanId: planId })
      },
    }

    return methods
  },
  {
    name: 'User',
    partialize: (storeState) => {
      const {
        creditsInitialized,
        creditsLoading,
        seedanceCreditsInitialized,
        seedanceCreditsLoading,
        ...rest
      } = storeState
      return rest as typeof storeState
    },
  },
  'localStorage',
)
