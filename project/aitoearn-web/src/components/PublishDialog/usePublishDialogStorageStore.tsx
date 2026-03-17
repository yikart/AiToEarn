import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { directTrans } from '@/app/i18n/client'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { confirm } from '@/lib/confirm'
import { useAccountStore } from '@/store/account'
import { createPersistStore } from '@/utils/createPersistStore'

export interface IPublishDialogStorageStore {
  pubListChoosed?: PubItem[]
  expandedPubItem?: PubItem
  pubList?: PubItem[]
}

const state: IPublishDialogStorageStore = {
  // 实时保存的发布数据
  pubListChoosed: undefined,
  // 保存当前展开的数据
  expandedPubItem: undefined,
  // 实时保存的 所有发布列表
  pubList: undefined,
}

export const usePublishDialogStorageStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    /**
     * 检查发布项是否有有效内容（视频、图片或描述）
     * @param pubItem 发布项
     * @returns 是否有有效内容
     */
    const hasValidContent = (pubItem: PubItem): boolean => {
      const { params } = pubItem
      // 检查是否有视频
      const hasVideo = !!params.video
      // 检查是否有图片
      const hasImages = !!(params.images && params.images.length > 0)
      // 检查是否有描述（非空字符串）
      const hasDescription = !!(params.des && params.des.trim().length > 0)

      return hasVideo || hasImages || hasDescription
    }

    const methods = {
      setExpandedPubItem(expandedPubItem: PubItem | undefined) {
        set({
          expandedPubItem,
        })
      },
      setPubData(pubListChoosed: PubItem[] | undefined) {
        // 过滤掉没有有效内容的项
        const filteredList = pubListChoosed?.filter(hasValidContent)
        // 如果过滤后为空数组，则不存储
        if (!filteredList || filteredList.length === 0) {
          set({ pubListChoosed: undefined })
          return
        }
        set({ pubListChoosed: filteredList })
      },
      setPubListData(pubList?: PubItem[]) {
        // 过滤掉没有有效内容的项
        const filteredList = pubList?.filter(hasValidContent)
        // 如果过滤后为空数组，则不存储
        if (!filteredList || filteredList.length === 0) {
          set({ pubList: undefined })
          return
        }
        set({ pubList: filteredList })
      },

      clearPubData() {
        set({ pubListChoosed: undefined, expandedPubItem: undefined, pubList: undefined })
      },

      // 恢复发布记录
      restorePubData() {
        let { pubListChoosed, expandedPubItem, pubList } = _get()

        if (pubListChoosed === undefined || pubListChoosed.length === 0) {
          return
        }
        // 提示用户是否恢复
        confirm({
          title: directTrans('publish', 'restoreData.title'),
          content: directTrans('publish', 'restoreData.content'),
          okText: directTrans('publish', 'restoreData.okText'),
          cancelText: directTrans('publish', 'restoreData.cancelText'),
          async onOk() {
            // 处理已选择的发布列表
            pubListChoosed = pubListChoosed
              ?.map(v => methods.processPubItem(v))
              .filter(Boolean) as PubItem[]

            // 处理所有发布列表
            if (pubList && pubList.length > 0) {
              pubList = pubList.map(v => methods.processPubItem(v)).filter(Boolean) as PubItem[]
            }

            // 恢复数据
            usePublishDialog.getState().setPubListChoosed(pubListChoosed)
            usePublishDialog.getState().setStep(2)
            usePublishDialog
              .getState()
              .setExpandedPubItem(
                pubListChoosed.find(v => v.account.id === expandedPubItem?.account.id),
              )
            if (pubList && pubList.length > 0) {
              setTimeout(() => {
                usePublishDialog.getState().setPubList(pubList ?? [])
              }, 50)
            }
          },
          onCancel() {
            set({
              pubListChoosed: undefined,
            })
          },
        })
      },

      /**
       * 处理单个发布项：更新账户信息、过滤无效媒体资源
       * @param pubItem 发布项
       * @returns 处理后的发布项，如果账户不存在则返回null
       */
      processPubItem(pubItem: PubItem): PubItem | null {
        const accountMap = useAccountStore.getState().accountMap
        const account = accountMap.get(pubItem.account.id)

        // 过滤掉没有ossUrl的图片
        pubItem.params.images = pubItem.params.images?.filter(img => img.ossUrl)

        // 过滤掉没有ossUrl、或者封面不存在、或者封面ossUrl不存在的视频
        if (
          pubItem.params.video
          && (!pubItem.params.video.ossUrl
            || !pubItem.params.video.cover
            || !pubItem.params.video.cover.ossUrl)
        ) {
          pubItem.params.video = undefined
        }

        // 更新视频URL和封面URL
        if (pubItem.params.video) {
          pubItem.params.video.videoUrl = pubItem.params.video.ossUrl!
          // 确保 cover 存在再更新
          if (pubItem.params.video.cover) {
            pubItem.params.video.cover.imgUrl = pubItem.params.video.cover.ossUrl!
          }
        }

        // 更新图片URL
        pubItem.params.images = pubItem.params.images?.map((img) => {
          img.imgUrl = img.ossUrl!
          return img
        })

        // 更新账户信息
        if (account) {
          pubItem.account = account
          return pubItem
        }

        // 账户不存在，返回null
        return null
      },
    }

    return methods
  },
  {
    name: 'PublishDialogStorage',
    version: 1,
  },
  'indexedDB',
)
