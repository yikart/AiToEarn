import lodash from 'lodash'
import { createPersistStore } from '@/utils/storage/createPersistStore'

/** 日历视图类型 */
export type CalendarViewType = 'month' | 'week'

export interface ISystemStore {
  /** 是否永久禁用余额不足提示 */
  disableLowBalanceAlert: boolean
  /** 是否永久禁用版本更新主动提醒 */
  disableAppReleaseModalAlert: boolean
  /** 日历视图类型（PC端） */
  calendarViewType: CalendarViewType
  /** 月视图是否显示公历节日 */
  calendarShowSolarFestivals: boolean
  /** 月视图是否显示二十四节气 */
  calendarShowSolarTerms: boolean
  /** 是否已关闭 Seedance 公告横幅 */
  dismissSeedanceBanner: boolean
  /** 我的任务当前选中的 Tab */
  myTasksTab: 'accepted' | 'published'
  /** GitHub Stars 缓存值 */
  githubStars: string
  /** GitHub Stars 缓存时间戳 */
  githubStarsUpdatedAt: number
  /** 移动端导航区域是否展开 */
  mobileNavExpanded: boolean
  /** 是否已关闭 Shopify 引导横幅 */
  dismissShopifyGuideBanner: boolean
  /** 是否不再显示 Agent 测试阶段提示 */
  disableAgentTestingNotice: boolean
}

const state: ISystemStore = {
  disableLowBalanceAlert: false,
  disableAppReleaseModalAlert: false,
  calendarViewType: 'week',
  calendarShowSolarFestivals: true,
  calendarShowSolarTerms: true,
  dismissSeedanceBanner: false,
  myTasksTab: 'accepted',
  githubStars: '11.5k',
  githubStarsUpdatedAt: 0,
  mobileNavExpanded: false,
  dismissShopifyGuideBanner: false,
  disableAgentTestingNotice: false,
}

function getState(): ISystemStore {
  return lodash.cloneDeep(state)
}

export const useSystemStore = createPersistStore(
  {
    ...getState(),
  },
  (set, _get) => {
    const methods = {
      /**
       * 设置是否永久禁用余额不足提示
       */
      setDisableLowBalanceAlert(disabled: boolean) {
        set({ disableLowBalanceAlert: disabled })
      },
      /**
       * 设置是否永久禁用版本更新主动提醒
       */
      setDisableAppReleaseModalAlert(disabled: boolean) {
        set({ disableAppReleaseModalAlert: disabled })
      },
      /**
       * 设置日历视图类型
       */
      setCalendarViewType(viewType: CalendarViewType) {
        set({ calendarViewType: viewType })
      },
      /**
       * 设置月视图是否显示公历节日
       */
      setCalendarShowSolarFestivals(show: boolean) {
        set({ calendarShowSolarFestivals: show })
      },
      /**
       * 设置月视图是否显示二十四节气
       */
      setCalendarShowSolarTerms(show: boolean) {
        set({ calendarShowSolarTerms: show })
      },
      /**
       * 设置是否已关闭 Seedance 公告横幅
       */
      setDismissSeedanceBanner(dismissed: boolean) {
        set({ dismissSeedanceBanner: dismissed })
      },
      /**
       * 设置我的任务当前选中的 Tab
       */
      setMyTasksTab(tab: 'accepted' | 'published') {
        set({ myTasksTab: tab })
      },
      setGitHubStars(stars: string) {
        set({ githubStars: stars, githubStarsUpdatedAt: Date.now() })
      },
      setMobileNavExpanded(expanded: boolean) {
        set({ mobileNavExpanded: expanded })
      },
      setDismissShopifyGuideBanner(dismissed: boolean) {
        set({ dismissShopifyGuideBanner: dismissed })
      },
      setDisableAgentTestingNotice(disabled: boolean) {
        set({ disableAgentTestingNotice: disabled })
      },
    }

    return methods
  },
  {
    name: 'System',
    version: 12,
    migrate(persistedState: any, version: number) {
      // v0→v1: 无需处理（已废弃的 batchAspectRatio 迁移）
      // v1→v2: 无需处理（已废弃的 batchImageSize 迁移）
      // v2→v3: batch* 字段已迁移到 DraftBoxConfigStore，清理旧字段
      if (version < 3) {
        delete persistedState.batchAspectRatio
        delete persistedState.batchDuration
        delete persistedState.batchQuantity
        delete persistedState.batchModelType
        delete persistedState.batchContentType
        delete persistedState.batchImageModel
        delete persistedState.batchImageCount
        delete persistedState.batchImageSize
      }
      // v3→v4: 重置 dismissSeedanceBanner 以显示新的视频模型促销 banner
      if (version < 4) {
        persistedState.dismissSeedanceBanner = false
      }
      if (version < 5) {
        delete persistedState.createTaskDescExpanded
      }
      // v5→v6: 重置 dismissSeedanceBanner 以显示新的 gpt image 2 公告 banner
      if (version < 6) {
        persistedState.dismissSeedanceBanner = false
      }
      // v6→v7: 重置 dismissSeedanceBanner 以显示新的 gpt image 2 限时免费公告 banner
      if (version < 7) {
        persistedState.dismissSeedanceBanner = false
      }
      // v8→v9: 重置 dismissSeedanceBanner 以显示新的 gpt-image-2 价格公告 banner
      if (version < 9) {
        persistedState.dismissSeedanceBanner = false
      }
      // v9→v10: 新增版本更新主动提醒禁用状态
      if (version < 10) {
        persistedState.disableAppReleaseModalAlert = false
      }
      // v10→v11: 重置 dismissSeedanceBanner，确保关闭过的用户可以重新看到当前公告
      if (version < 11) {
        persistedState.dismissSeedanceBanner = false
      }
      if (version < 12) {
        persistedState.disableAgentTestingNotice = false
      }

      const persistedKeys = Object.keys(persistedState)
      const currentKeys = new Set([...Object.keys(state), 'lastUpdateTime', '_hasHydrated'])
      persistedKeys.forEach((persistedKey) => {
        if (!currentKeys.has(persistedKey)) {
          delete persistedState[persistedKey]
        }
      })

      return persistedState
    },
  },
  'indexedDB',
)
