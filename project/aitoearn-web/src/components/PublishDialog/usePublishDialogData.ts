import type { PublishOptionValueItem } from '@/api/channels/channel.types'
import type { PinterestBoardItem } from '@/api/platforms/pinterest.types'
import type {
  BiblPartItem,
  YouTubeCategoryItem,
} from '@/components/PublishDialog/publishDialog.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { apiGetBilibiliPartitions } from '@/api/platforms/bilibili.api'
import { getPinterestBoardListApi } from '@/api/platforms/pinterest.api'
import { apiGetYouTubeCategories } from '@/api/platforms/youtube.api'
import { PlatType } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'

export interface IPublishDialogDataStore {
  // b站分区列表
  bilibiliPartitions: BiblPartItem[]
  // b站分区加载状态
  bilibiliPartitionsLoading: boolean
  // YouTube视频分类列表
  youTubeCategories: YouTubeCategoryItem[]
  // YouTube视频分类加载状态
  youTubeCategoriesLoading: boolean
  // Pinterest Board列表
  pinterestBoards: PinterestBoardItem[]
}

const store: IPublishDialogDataStore = {
  bilibiliPartitions: [],
  bilibiliPartitionsLoading: false,
  youTubeCategories: [],
  youTubeCategoriesLoading: false,
  pinterestBoards: [],
}

function getStore() {
  return lodash.cloneDeep(store)
}

function mapYouTubeCategory(item: PublishOptionValueItem): YouTubeCategoryItem {
  return {
    id: item.value,
    snippet: {
      title: item.label,
      description: item.description,
    },
  }
}

function mapPinterestBoard(item: PublishOptionValueItem): PinterestBoardItem {
  return {
    id: item.value,
    name: item.label,
    description: item.description,
  }
}

/**
 * 存放发布弹框一些平台获取的三方数据
 * 如：b站的分区列表
 */
export const usePublishDialogData = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        // 获取b站分区列表
        async getBilibiliPartitions() {
          if (get().bilibiliPartitions.length !== 0)
            return get().bilibiliPartitions
          if (get().bilibiliPartitionsLoading)
            return get().bilibiliPartitions

          set({ bilibiliPartitionsLoading: true })
          try {
            const res = await apiGetBilibiliPartitions(
              useAccountStore.getState().accountList.find(v => v.type === PlatType.BILIBILI)!.id,
            )
            const partitions = res?.data ?? []
            set({
              bilibiliPartitions: partitions,
            })
            return partitions
          }
          finally {
            set({ bilibiliPartitionsLoading: false })
          }
        },
        // 获取YouTube视频分类
        async getYouTubeCategories(accountId?: string, regionCode?: string) {
          if (get().youTubeCategoriesLoading)
            return get().youTubeCategories

          let youtubeAccount

          if (accountId) {
            // 如果提供了账户ID，使用指定的账户
            youtubeAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.id === accountId && v.type === PlatType.YouTube)
          }
          else {
            // 如果没有提供账户ID，使用第一个找到的YouTube账户（保持向后兼容）
            youtubeAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.type === PlatType.YouTube)
          }

          if (!youtubeAccount) {
            console.warn('没有找到YouTube账户')
            return
          }

          // 如果没有提供 regionCode，使用默认值 "US"
          const defaultRegionCode = regionCode || 'US'

          set({ youTubeCategoriesLoading: true })
          try {
            const res = await apiGetYouTubeCategories(
              youtubeAccount?.id || '',
              defaultRegionCode,
            )
            const categories = res?.data?.items.map(mapYouTubeCategory) || []
            set({
              youTubeCategories: categories,
            })
            return categories
          }
          finally {
            set({ youTubeCategoriesLoading: false })
          }
        },
        // 获取Pinterest Board列表
        async getPinterestBoards(forceRefresh = false, accountId?: string) {
          if (!forceRefresh && get().pinterestBoards.length !== 0)
            return

          let pinterestAccount

          if (accountId) {
            // 如果提供了账户ID，使用指定的账户
            pinterestAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.id === accountId && v.type === PlatType.Pinterest)
          }
          else {
            // 如果没有提供账户ID，使用第一个找到的Pinterest账户（保持向后兼容）
            pinterestAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.type === PlatType.Pinterest)
          }

          if (!pinterestAccount) {
            console.warn('没有找到Pinterest账户')
            return
          }

          const res = await getPinterestBoardListApi(pinterestAccount.id)
          const pinterestBoards = res?.code === 0
            ? res.data.items.map(mapPinterestBoard)
            : []

          set({
            pinterestBoards,
          })
          return pinterestBoards
        },
      }

      return methods
    },
  ),
)
