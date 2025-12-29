/**
 * ChannelManager - 频道管理器状态管理
 * 管理三页面视图状态、授权状态、侧边栏状态等
 */

import type {
  AuthState,
  AuthUrlResponse,
  ChannelManagerMethods,
  ChannelManagerState,
  ChannelManagerView,
} from './types'
import type { SocialAccount } from '@/api/types/account.type'
import type { PluginPlatformType } from '@/store/plugin'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { apiCheckBilibiliAuth, apiGetBilibiliLoginUrl } from '@/api/plat/bilibili'
import { createKwaiAuth, getKwaiAuthStatus } from '@/api/plat/kwai'
import {
  apiCheckYoutubeAuth,
  checkMetaAuthApi,
  checkPinterestAuthApi,
  checkTiktokAuthApi,
  checkWxGzAuthApi,
  getFacebookAuthUrlApi,
  getInstagramAuthUrlApi,
  getLinkedInAuthUrlApi,
  getPinterestAuthUrlApi,
  getThreadsAuthUrlApi,
  getTiktokAuthUrlApi,
  getWxGzhAuthUrlApi,
  getYouTubeAuthUrlApi,
} from '@/api/platAuth'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import i18next from '@/app/i18n/client'
import { toast } from '@/lib/toast'
import { useAccountStore } from '@/store/account'
import { PLUGIN_SUPPORTED_PLATFORMS, PluginStatus, usePluginStore } from '@/store/plugin'
import { useUserStore } from '@/store/user'
import { DEFAULT_AUTH_COUNTDOWN, POLLING_INTERVAL } from './types'

/**
 * 获取翻译文本
 */
function t(key: string, options?: Record<string, string>): string {
  return i18next.t(key, { ns: 'account', ...options })
}

/**
 * 检查平台是否为插件支持的平台
 */
function isPluginSupportedPlatform(platform: PlatType): platform is PluginPlatformType {
  return PLUGIN_SUPPORTED_PLATFORMS.includes(platform as PluginPlatformType)
}

/** 初始授权状态 */
const initialAuthState: AuthState = {
  platform: null,
  taskId: null,
  authUrl: null,
  countdown: DEFAULT_AUTH_COUNTDOWN,
  isPolling: false,
  error: null,
  isTimeout: false,
}

/** 初始状态 */
const initialState: ChannelManagerState = {
  open: false,
  currentView: 'main',
  selectedPlatform: 'all',
  authState: { ...initialAuthState },
  targetSpaceId: null,
  onAuthSuccess: null,
  isNewUser: false,
}

function getInitialState(): ChannelManagerState {
  return lodash.cloneDeep(initialState)
}

/** 轮询定时器ID */
let pollingIntervalId: ReturnType<typeof setInterval> | null = null
/** 倒计时定时器ID */
let countdownIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * 清理所有定时器
 */
function clearAllTimers() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId)
    pollingIntervalId = null
  }
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId)
    countdownIntervalId = null
  }
}

/**
 * 根据平台类型获取授权URL
 */
async function getAuthUrl(
  platform: PlatType,
  spaceId?: string,
): Promise<AuthUrlResponse | null> {
  try {
    let res: any

    switch (platform) {
      case PlatType.KWAI:
        res = await createKwaiAuth('pc', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.BILIBILI:
        res = await apiGetBilibiliLoginUrl('pc', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.YouTube:
        res = await getYouTubeAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.Tiktok:
        res = await getTiktokAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.Facebook:
        res = await getFacebookAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.Instagram:
        res = await getInstagramAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.Threads:
        res = await getThreadsAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.LinkedIn:
        res = await getLinkedInAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.Twitter:
        // Twitter 使用与 Meta 系列相同的授权逻辑
        res = await getLinkedInAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      case PlatType.WxGzh:
        res = await getWxGzhAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.id || res.data.taskId }
        }
        break

      case PlatType.Pinterest:
        res = await getPinterestAuthUrlApi('', spaceId)
        if (res?.data) {
          return { url: res.data.url, taskId: res.data.taskId }
        }
        break

      default:
        console.warn(`Platform ${platform} not supported for OAuth`)
        return null
    }

    // 检查登录状态
    if (res?.code === 1) {
      useUserStore.getState().logout()
      return null
    }

    return null
  }
  catch (error) {
    console.error(`Failed to get auth URL for ${platform}:`, error)
    return null
  }
}

/**
 * 根据平台类型检查授权状态
 */
async function checkAuthStatus(
  platform: PlatType,
  taskId: string,
): Promise<{ status: number, data?: any } | null> {
  try {
    let res: any

    switch (platform) {
      case PlatType.KWAI:
        res = await getKwaiAuthStatus(taskId)
        break

      case PlatType.BILIBILI:
        res = await apiCheckBilibiliAuth(taskId)
        break

      case PlatType.YouTube:
        res = await apiCheckYoutubeAuth(taskId)
        break

      case PlatType.Tiktok:
        res = await checkTiktokAuthApi(taskId)
        break

      case PlatType.Facebook:
      case PlatType.Instagram:
      case PlatType.Threads:
      case PlatType.LinkedIn:
        res = await checkMetaAuthApi(taskId)
        break

      case PlatType.WxGzh:
        res = await checkWxGzAuthApi(taskId)
        break

      case PlatType.Pinterest:
        res = await checkPinterestAuthApi(taskId)
        break

      default:
        return null
    }

    if (res?.data) {
      return { status: res.data.status, data: res.data }
    }

    return null
  }
  catch (error) {
    console.error(`Failed to check auth status for ${platform}:`, error)
    return null
  }
}

export const useChannelManagerStore = create(
  combine(getInitialState(), (set, get) => {
    const methods: ChannelManagerMethods = {
      /** 打开弹框（默认显示主页） */
      openModal() {
        const accountList = useAccountStore.getState().accountList
        const isNewUser = accountList.length === 0

        set({
          open: true,
          currentView: isNewUser ? 'connect-list' : 'main',
          isNewUser,
        })
      },

      /** 关闭弹框 */
      closeModal() {
        // 停止所有授权相关的定时器
        methods.stopAuth()
        set({
          open: false,
          currentView: 'main',
          selectedPlatform: 'all',
          authState: { ...initialAuthState },
          targetSpaceId: null,
        })
      },

      /** 直接打开并进入指定平台的授权流程 */
      openAndAuth(platform: PlatType, spaceId?: string) {
        // 如果没有指定空间，使用默认空间
        const accountGroupList = useAccountStore.getState().accountGroupList
        const defaultSpace = accountGroupList.find(g => g.isDefault)
        const targetSpaceId = spaceId || defaultSpace?.id || null

        set({
          open: true,
          currentView: 'auth-loading',
          targetSpaceId,
        })

        // 开始授权流程
        methods.startAuth(platform, targetSpaceId || undefined)
      },

      /** 设置授权成功回调 */
      setOnAuthSuccess(callback) {
        set({ onAuthSuccess: callback })
      },

      /** 切换视图 */
      setCurrentView(view: ChannelManagerView) {
        set({ currentView: view })
      },

      /** 设置侧边栏选中的平台 */
      setSelectedPlatform(platform) {
        set({ selectedPlatform: platform })
      },

      /** 设置目标空间ID */
      setTargetSpaceId(spaceId) {
        set({ targetSpaceId: spaceId })
      },

      /** 开始授权流程 */
      async startAuth(platform: PlatType, spaceId?: string) {
        // 清理之前的定时器
        clearAllTimers()

        // 设置授权状态
        set({
          currentView: 'auth-loading',
          authState: {
            ...initialAuthState,
            platform,
            isPolling: true,
          },
          targetSpaceId: spaceId || get().targetSpaceId,
        })

        // 检查是否为插件支持的平台
        if (isPluginSupportedPlatform(platform)) {
          await methods.handlePluginPlatformAuth(platform, spaceId)
          return
        }

        // OAuth授权流程
        try {
          // 获取授权URL
          const authData = await getAuthUrl(platform, spaceId)

          if (!authData) {
            set({
              authState: {
                ...get().authState,
                error: 'Failed to get auth URL',
                isPolling: false,
              },
            })
            return
          }

          // 更新状态并打开授权窗口
          set({
            authState: {
              ...get().authState,
              taskId: authData.taskId,
              authUrl: authData.url,
            },
          })

          // 打开授权窗口
          window.open(authData.url)

          // 启动倒计时
          countdownIntervalId = setInterval(() => {
            const currentState = get()
            const newCountdown = currentState.authState.countdown - 1

            if (newCountdown <= 0) {
              // 超时
              methods.stopAuth()
              set({
                authState: {
                  ...currentState.authState,
                  isTimeout: true,
                  isPolling: false,
                  countdown: 0,
                },
              })
            }
            else {
              set({
                authState: {
                  ...currentState.authState,
                  countdown: newCountdown,
                },
              })
            }
          }, 1000)

          // 启动轮询
          pollingIntervalId = setInterval(async () => {
            const currentState = get()
            const { authState } = currentState

            if (!authState.taskId || !authState.platform) {
              return
            }

            const result = await checkAuthStatus(
              authState.platform,
              authState.taskId,
            )

            if (result?.status === 1) {
              // 授权成功
              clearAllTimers()

              // 刷新账户列表
              await useAccountStore.getState().getAccountList()

              // 获取新添加的账户
              const accountList = useAccountStore.getState().accountList
              const newAccount = accountList.find(
                acc => acc.type === authState.platform,
              )

              if (newAccount) {
                methods.handleAuthSuccess(newAccount)
              }
              else {
                // 没找到新账户，但也算成功
                set({
                  currentView: 'main',
                  selectedPlatform: authState.platform || 'all',
                  authState: { ...initialAuthState },
                  isNewUser: false,
                })
              }
            }
          }, POLLING_INTERVAL)
        }
        catch (error) {
          console.error('Auth error:', error)
          set({
            authState: {
              ...get().authState,
              error: error instanceof Error ? error.message : 'Unknown error',
              isPolling: false,
            },
          })
        }
      },

      /**
       * 处理插件平台的授权（小红书、抖音等）
       * 这些平台通过浏览器插件同步账号，而非OAuth
       */
      async handlePluginPlatformAuth(platform: PluginPlatformType, spaceId?: string) {
        const pluginStore = usePluginStore.getState()
        const platformName = AccountPlatInfoMap.get(platform)?.name || platform

        // 检查插件是否就绪
        if (pluginStore.status !== PluginStatus.READY) {
          // 插件未就绪，重置状态并打开插件弹框
          set({
            currentView: 'connect-list',
            authState: { ...initialAuthState },
          })
          toast.warning(t('channelManager.pluginNotReady', { platform: platformName }))
          // 打开插件弹框引导用户安装/授权
          pluginStore.openPluginModal()
          return
        }

        // 检查是否有账号
        const account = pluginStore.platformAccounts[platform]
        if (!account) {
          // 平台未登录，重置状态并打开插件弹框
          set({
            currentView: 'connect-list',
            authState: { ...initialAuthState },
          })
          toast.warning(t('channelManager.platformNotLoggedIn', { platform: platformName }))
          // 打开插件弹框引导用户登录
          pluginStore.openPluginModal()
          return
        }

        // 同步账号到数据库
        try {
          const result = await pluginStore.syncAccountToDatabase(platform, spaceId)

          if (result) {
            // 同步成功
            toast.success(t('channelManager.syncSuccess'))

            // 刷新账户列表
            await useAccountStore.getState().getAccountList()

            // 处理授权成功
            methods.handleAuthSuccess(result)
          }
          else {
            set({
              currentView: 'connect-list',
              authState: { ...initialAuthState },
            })
            toast.error(t('channelManager.syncFailed'))
          }
        }
        catch (error) {
          console.error('Plugin auth error:', error)
          set({
            currentView: 'connect-list',
            authState: { ...initialAuthState },
          })
          toast.error(t('channelManager.syncFailed'))
        }
      },

      /** 停止授权（取消/超时） */
      stopAuth() {
        clearAllTimers()
        set({
          authState: {
            ...get().authState,
            isPolling: false,
          },
        })
      },

      /** 重新打开授权页面 */
      reopenAuthWindow() {
        const { authState } = get()
        if (authState.authUrl) {
          window.open(authState.authUrl)
        }
      },

      /** 授权成功处理 */
      handleAuthSuccess(account: SocialAccount) {
        const { authState, onAuthSuccess } = get()
        const platform = authState.platform

        // 调用外部回调
        if (onAuthSuccess && platform) {
          onAuthSuccess(account, platform)
        }

        // 重置状态，跳转到主页并选中该平台
        set({
          currentView: 'main',
          selectedPlatform: platform || 'all',
          authState: { ...initialAuthState },
          isNewUser: false,
        })
      },

      /** 重置状态 */
      reset() {
        clearAllTimers()
        set(getInitialState())
      },

      /** 检查是否为新用户 */
      checkIsNewUser() {
        const accountList = useAccountStore.getState().accountList
        set({ isNewUser: accountList.length === 0 })
      },
    }

    return methods
  }),
)
