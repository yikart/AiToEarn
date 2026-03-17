import lodash from 'lodash'
import { createPersistStore } from '@/utils/createPersistStore'

/** 日历视图类型 */
export type CalendarViewType = 'month' | 'week'

export interface ISystemStore {
  /** 日历视图类型（PC端） */
  calendarViewType: CalendarViewType
  /** 是否已关闭 Seedance 公告横幅 */
  dismissSeedanceBanner: boolean
  /** GitHub Stars 缓存值 */
  githubStars: string
  /** GitHub Stars 缓存时间戳 */
  githubStarsUpdatedAt: number
}

const state: ISystemStore = {
  calendarViewType: 'week',
  dismissSeedanceBanner: false,
  githubStars: '11.5k',
  githubStarsUpdatedAt: 0,
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
       * 设置是否已关闭 Seedance 公告横幅
       */
      setDismissSeedanceBanner(dismissed: boolean) {
        set({ dismissSeedanceBanner: dismissed })
      },
      setGitHubStars(stars: string) {
        set({ githubStars: stars, githubStarsUpdatedAt: Date.now() })
      },
    }

    return methods
  },
  {
    name: 'System',
    version: 5,
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
      // v4→v5: 移除任务系统和支付系统相关字段
      if (version < 5) {
        delete persistedState.disableLowBalanceAlert
        delete persistedState.myTasksTab
        delete persistedState.createTaskDescExpanded
      }
      return persistedState
    },
  },
  'indexedDB',
)
