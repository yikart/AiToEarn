import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'
import { directTrans } from '@/app/i18n/client'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { modalApi, useConfigStore } from '@/store/config'
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
    const methods = {
      setExpandedPubItem(expandedPubItem: PubItem | undefined) {
        set({
          expandedPubItem,
        })
      },
      setPubData(pubListChoosed: PubItem[] | undefined) {
        set({ pubListChoosed })
      },
      setPubListData(pubList?: PubItem[]) {
        set({ pubList })
      },

      clearPubData() {
        set({ pubListChoosed: undefined, expandedPubItem: undefined, pubList: undefined })
      },

      // 恢复发布记录
      restorePubData() {
        const { pubListChoosed } = _get()
        if (pubListChoosed === undefined || pubListChoosed.length === 0) {
          return
        }
        // 提示用户是否恢复
        modalApi.value.confirm({
          title: directTrans('publish', 'restoreData.title'),
          icon: <ExclamationCircleFilled />,
          content: directTrans('publish', 'restoreData.content'),
          okText: directTrans('publish', 'restoreData.okText'),
          cancelText: directTrans('publish', 'restoreData.cancelText'),
          okButtonProps: {
            type: 'primary',
          },
          cancelButtonProps: {
            type: 'text',
          },
          centered: true,
          async onOk() {
            await methods.restorePubDataCore()
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

        // 过滤掉没有ossUrl、或者封面ossUrl的视频
        if (pubItem.params.video && (!pubItem.params.video.ossUrl || !pubItem.params.video.cover.ossUrl)) {
          pubItem.params.video = undefined
        }

        // 更新视频URL
        if (pubItem.params.video) {
          pubItem.params.video.videoUrl = pubItem.params.video.ossUrl!
          pubItem.params.video.cover.imgUrl = pubItem.params.video.cover.ossUrl!
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

      async restorePubDataCore() {
        let { pubListChoosed, expandedPubItem, pubList } = _get()

        // 处理已选择的发布列表
        pubListChoosed = pubListChoosed?.map(v => methods.processPubItem(v))
          .filter(Boolean) as PubItem[]

        // 处理当前展开的发布项
        if (expandedPubItem) {
          const processedExpandedItem = methods.processPubItem(expandedPubItem)
          expandedPubItem = processedExpandedItem || undefined
        }

        // 处理所有发布列表
        if (pubList && pubList.length > 0) {
          pubList = pubList.map(v => methods.processPubItem(v))
            .filter(Boolean) as PubItem[]
        }

        // 恢复数据
        usePublishDialog.getState().setPubListChoosed(pubListChoosed)
        usePublishDialog.getState().setStep(2)
        usePublishDialog.getState().setExpandedPubItem(expandedPubItem)
        if (pubList && pubList.length > 0) {
          setTimeout(() => {
            usePublishDialog.getState().setPubList(pubList)
          }, 50)
        }
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
