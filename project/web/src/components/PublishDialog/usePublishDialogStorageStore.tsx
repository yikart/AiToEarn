import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { modalApi, useConfigStore } from '@/store/config'
import { createPersistStore } from '@/utils/createPersistStore'

export interface IPublishDialogStorageStore {
  pubData?: PubItem[]
  expandedPubItem?: PubItem
}

const state: IPublishDialogStorageStore = {
  // 实时保存的发布数据
  pubData: undefined,
  // 保存当前展开的数据
  expandedPubItem: undefined,
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
      setPubData(pubData: PubItem[] | undefined) {
        set({ pubData })
      },

      clearPubData() {
        set({ pubData: undefined, expandedPubItem: undefined })
      },

      // 恢复发布记录
      restorePubData() {
        const { pubData } = _get()
        if (pubData === undefined || pubData.length === 0) {
          return
        }
        // 提示用户是否恢复
        modalApi.value.confirm({
          title: '温馨提示',
          icon: <ExclamationCircleFilled />,
          content: '系统检测到您有未完成的发布记录，是否要恢复？',
          okText: '恢复',
          cancelText: '不恢复',
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
              pubData: undefined,
            })
          },
        })
      },

      async restorePubDataCore() {
        let { pubData, expandedPubItem } = _get()
        const accountMap = useAccountStore.getState().accountMap
        // 更新成最新的账户信息
        pubData = pubData?.map((v) => {
          const account = accountMap.get(v.account.id)
          // 过滤掉没有ossUrl的图片
          v.params.images = v.params.images?.filter(img => img.ossUrl)
          // 过滤掉没有ossUrl、或者封面ossUrl的视频
          if (v.params.video && (!v.params.video.ossUrl || !v.params.video.cover.ossUrl)) {
            v.params.video = undefined
          }

          if (v.params.video) {
            v.params.video.videoUrl = v.params.video.ossUrl!
            v.params.video.cover.imgUrl = v.params.video.cover.ossUrl!
          }

          v.params.images = v.params.images?.map((img) => {
            img.imgUrl = img.ossUrl!
            return img
          })

          if (account) {
            v.account = account
          }
          else {
            return null
          }
          return v
        }).filter(Boolean) as PubItem[]

        // 恢复数据
        usePublishDialog.getState().setPubListChoosed(pubData)
        usePublishDialog.getState().setStep(2)
        usePublishDialog.getState().setExpandedPubItem(expandedPubItem)
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
