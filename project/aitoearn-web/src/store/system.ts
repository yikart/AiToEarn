import lodash from 'lodash'
import { createPersistStore } from '@/utils/createPersistStore'

/** 日历视图类型 */
export type CalendarViewType = 'month' | 'week'

export interface ISystemStore {
  /** 是否永久禁用余额不足提示 */
  disableLowBalanceAlert: boolean
  /** 日历视图类型（PC端） */
  calendarViewType: CalendarViewType
  /** 是否已关闭 Seedance 公告横幅 */
  dismissSeedanceBanner: boolean
  /** 我的任务当前选中的 Tab */
  myTasksTab: 'accepted' | 'published'
  /** 创建任务 - 描述区域是否展开 */
  createTaskDescExpanded: boolean
  /** GitHub Stars 缓存值 */
  githubStars: string
  /** GitHub Stars 缓存时间戳 */
  githubStarsUpdatedAt: number
}

const state: ISystemStore = {
  disableLowBalanceAlert: false,
  calendarViewType: 'week',
  dismissSeedanceBanner: false,
  myTasksTab: 'accepted',
  createTaskDescExpanded: false,
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
       * 设置是否永久禁用余额不足提示
       */
      setDisableLowBalanceAlert(disabled: boolean) {
        set({ disableLowBalanceAlert: disabled })
      },
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
      /**
       * 设置我的任务当前选中的 Tab
       */
      setMyTasksTab(tab: 'accepted' | 'published') {
        set({ myTasksTab: tab })
      },
      /**
       * 设置创建任务 - 描述区域是否展开
       */
      setCreateTaskDescExpanded(expanded: boolean) {
        set({ createTaskDescExpanded: expanded })
      },
      setGitHubStars(stars: string) {
        set({ githubStars: stars, githubStarsUpdatedAt: Date.now() })
      },
    }

    return methods
  },
  {
    name: 'System',
    version: 4,
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
      return persistedState
    },
  },
  'indexedDB',
)
