import { createPersistStore } from '@/utils/createPersistStore'

export interface ISystemStore {
  // 视频发布是否开启填写更多参数
  moreParamsOpen: boolean
}

const state: ISystemStore = {
  moreParamsOpen: false,
}

export const useSystemStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      setMoreParamsOpen(moreParamsOpen: boolean) {
        set({
          moreParamsOpen,
        })
      },
    }

    return methods
  },
  {
    name: 'System',
  },
)
