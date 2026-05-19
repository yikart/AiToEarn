import lodash from 'lodash'
import { createPersistStore } from '@/utils/createPersistStore'

/** 日历视图类型 */
export type CalendarViewType = 'month' | 'week'

export interface ISystemStore {
  /** 日历视图类型（PC端） */
  calendarViewType: CalendarViewType
  /** 月视图是否显示公历节日 */
  calendarShowSolarFestivals: boolean
  /** 月视图是否显示二十四节气 */
  calendarShowSolarTerms: boolean
  /** 是否已关闭 Seedance 公告横幅 */
  dismissSeedanceBanner: boolean
  /** GitHub Stars 缓存值 */
  githubStars: string
  /** GitHub Stars 缓存时间戳 */
  githubStarsUpdatedAt: number
  /** 移动端导航区域是否展开 */
  mobileNavExpanded: boolean
  /** 是否跳过 Twitter 探索积分确认 */
  skipTwitterExploreConfirm: boolean
}

const state: ISystemStore = {
  calendarViewType: 'week',
  calendarShowSolarFestivals: true,
  calendarShowSolarTerms: true,
  dismissSeedanceBanner: false,
  githubStars: '11.5k',
  githubStarsUpdatedAt: 0,
  mobileNavExpanded: false,
  skipTwitterExploreConfirm: false,
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
      setGitHubStars(stars: string) {
        set({ githubStars: stars, githubStarsUpdatedAt: Date.now() })
      },
      setMobileNavExpanded(expanded: boolean) {
        set({ mobileNavExpanded: expanded })
      },
      setSkipTwitterExploreConfirm(skip: boolean) {
        set({ skipTwitterExploreConfirm: skip })
      },
    }

    return methods
  },
  {
    name: 'System',
    version: 11,
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
      // v7→v8: 新增 skipTwitterExploreConfirm 字段
      if (version < 8) {
        persistedState.skipTwitterExploreConfirm = false
      }
      // v8→v9: 重置 dismissSeedanceBanner 以显示新的 gpt-image-2 价格公告 banner
      if (version < 9) {
        persistedState.dismissSeedanceBanner = false
      }
      if (version < 11) {
        delete persistedState.disableLowBalanceAlert
      }
      return persistedState
    },
  },
  'indexedDB',
)
