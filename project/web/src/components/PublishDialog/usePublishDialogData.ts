import type { FacebookPageItem } from '@/api/plat/facebook'
import type { BiblPartItem, YouTubeCategoryItem } from '@/components/PublishDialog/publishDialog.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getPinterestBoardListApi } from '@/api/pinterest'
import { apiGetBilibiliPartitions } from '@/api/plat/bilibili'
import { apiGetFacebookPages } from '@/api/plat/facebook'
import { apiGetYouTubeCategories, apiGetYouTubeRegions } from '@/api/plat/youtube'
import { PlatType } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'

export interface IPublishDialogDataStore {
  // b站分区列表
  bilibiliPartitions: BiblPartItem[]
  // Facebook页面列表
  facebookPages: FacebookPageItem[]
  // YouTube视频分类列表
  youTubeCategories: YouTubeCategoryItem[]
  // YouTube国区列表
  youTubeRegions: string[]
  // Pinterest Board列表
  pinterestBoards: Array<{
    id: string
    name: string
    description?: string
  }>
}

const store: IPublishDialogDataStore = {
  bilibiliPartitions: [],
  facebookPages: [],
  youTubeCategories: [],
  youTubeRegions: [],
  pinterestBoards: [],
}

function getStore() {
  return lodash.cloneDeep(store)
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
            return
          const res = await apiGetBilibiliPartitions(
            useAccountStore
              .getState()
              .accountList
              .find(v => v.type === PlatType.BILIBILI)!.id,
          )
          set({
            bilibiliPartitions: res?.data,
          })
          return res?.data
        },
        // 获取Facebook页面列表
        async getFacebookPages(accountId?: string) {
          if (get().facebookPages.length !== 0)
            return

          let facebookAccount

          if (accountId) {
            // 如果提供了账户ID，使用指定的账户
            facebookAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.id === accountId && v.type === PlatType.Facebook)
          }
          else {
            // 如果没有提供账户ID，使用第一个找到的Facebook账户（保持向后兼容）
            facebookAccount = useAccountStore
              .getState()
              .accountList
              .find(v => v.type === PlatType.Facebook)
          }

          if (!facebookAccount) {
            console.warn('没有找到Facebook账户')
            return
          }

          const res: any = await apiGetFacebookPages(facebookAccount.account)
          set({
            facebookPages: res?.data || [],
          })
          return res?.data
        },
        // 获取YouTube国区列表
        async getYouTubeRegions(accountId?: string) {
          if (get().youTubeRegions.length !== 0)
            return

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

          const res: any = await apiGetYouTubeRegions(youtubeAccount.id)
          set({
            youTubeRegions: res?.data?.regionCode || [],
          })
          return res?.data?.regionCode
        },
        // 获取YouTube视频分类
        async getYouTubeCategories(accountId?: string, regionCode?: string) {
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

          const res: any = await apiGetYouTubeCategories(youtubeAccount?.id || '', defaultRegionCode)
          set({
            youTubeCategories: res?.data.items || [],
          })
          return res?.data
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

          const res: any = await getPinterestBoardListApi({ page: 1, size: 100 }, pinterestAccount.id)
          set({
            pinterestBoards: res?.data?.list || [],
          })
          return res?.data?.list
        },
      }

      return methods
    },
  ),
)
