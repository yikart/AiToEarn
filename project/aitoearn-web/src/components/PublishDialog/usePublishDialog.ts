import type { SocialAccount } from '@/api/types/account.type'
import type { ErrPubParamsMapType } from '@/components/PublishDialog/hooks/usePubParamsVerify'
import type { IPubParams, PubItem } from '@/components/PublishDialog/publishDialog.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { AccountPlatInfoMap, isPlatformAvailable } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'

export interface IPublishDialogStore {
  // 选择的发布列表
  pubListChoosed: PubItem[]
  // 所有发布列表
  pubList: PubItem[]
  // 通用发布参数
  commonPubParams: IPubParams
  // 当前步骤，0=所有账号没有参数，要设置参数。 1=所有账号有参数，详细设置参数
  step: number
  // 第二步时需要，展开的账户参数
  expandedPubItem?: PubItem
  // 错误提示
  errParamsMap?: ErrPubParamsMapType
  warningParamsMap?: ErrPubParamsMapType
  // 发布时间，为空则为立即发布
  pubTime?: string
  openLeft: boolean
  // 预填内容加载中
  prefillLoading: boolean
}

const store: IPublishDialogStore = {
  pubListChoosed: [],
  pubTime: undefined,
  pubList: [],
  step: 0,
  commonPubParams: {
    title: '',
    des: '',
    video: undefined,
    images: [],
    option: {
      bilibili: {
        tid: undefined,
        copyright: 1,
        source: '',
      },
      facebook: {
        page_id: undefined,
      },
      instagram: {
        content_category: undefined,
      },
    },
  },
  expandedPubItem: undefined,
  errParamsMap: undefined,
  warningParamsMap: undefined,
  openLeft: false,
  prefillLoading: false,
}

function getStore() {
  return lodash.cloneDeep(store)
}

export const usePublishDialog = create(
  combine(
    {
      ...getStore(),
    },
    (set, get, storeApi) => {
      const methods = {
        setPrefillLoading(prefillLoading: boolean) {
          set({ prefillLoading })
        },
        setOpenLeft(openLeft: boolean) {
          set({
            openLeft,
          })
        },
        setPubListChoosed(pubListChoosed: PubItem[]) {
          set({
            pubListChoosed,
          })
        },
        setExpandedPubItem(expandedPubItem: PubItem | undefined) {
          if (!expandedPubItem)
            return
          usePublishDialogStorageStore.getState().setExpandedPubItem(expandedPubItem)
          set({
            expandedPubItem,
          })
        },
        setErrParamsMap(errParamsMap: ErrPubParamsMapType) {
          set({
            errParamsMap,
          })
        },
        setWarningParamsMap(warningParamsMap: ErrPubParamsMapType) {
          set({
            warningParamsMap,
          })
        },
        setStep(step: number) {
          set({ step })
        },
        setPubTime(pubTime: string | undefined) {
          set({ pubTime })
        },
        setPubList(pubList: PubItem[]) {
          set({ pubList })
        },

        // 清空所有数据
        clear() {
          set({
            ...getStore(),
          })
        },

        // 初始化发布参数
        pubParamsInit(): IPubParams {
          return lodash.cloneDeep(get().commonPubParams)
        },

        /**
         * 初始化
         * @param account 账户列表
         * @param defaultAccountIds 默认选中的账户Id列表
         */
        init(account: SocialAccount[], defaultAccountIds?: string[]) {
          const pubList: PubItem[] = []

          account.map((v) => {
            pubList.push({
              account: v,
              params: methods.pubParamsInit(),
            })
          })

          if (defaultAccountIds && defaultAccountIds.length > 0) {
            // 过滤掉离线账号（status === 0）和区域不可用的平台
            const validIds = defaultAccountIds.filter((id) => {
              const acc = account.find(a => a.id === id)
              return acc && acc.status !== 0 && isPlatformAvailable(acc.type)
            })

            const chosen = pubList.filter(p => validIds.includes(p.account.id))
            methods.setPubListChoosed(chosen)

            // 如果只有一个，设置为 expandedPubItem
            if (chosen.length === 1) {
              set({ expandedPubItem: chosen[0] })
            }
          }

          set({
            pubList,
          })
        },

        // 参数设置到所有账户
        setAccountAllParams(pubParmas: Partial<IPubParams>) {
          const pubList = [...get().pubList]
          const commonPubParams = { ...get().commonPubParams }
          let pubListChoosed = [...get().pubListChoosed]

          // 更新 commonPubParams
          for (const key in pubParmas) {
            if (Object.hasOwn(pubParmas, key)) {
              ;(commonPubParams as any)[key] = (pubParmas as any)[key]
            }
          }

          // 更新所有账户的参数（创建新对象引用，避免 memo 缓存导致 UI 不更新）
          for (let i = 0; i < pubList.length; i++) {
            const v = pubList[i]
            const platConfig = AccountPlatInfoMap.get(v.account.type)!
            const newParams = { ...v.params }
            let needUpdate = false

            // 更新描述
            if (pubParmas.des !== undefined) {
              newParams.des = pubParmas.des
              needUpdate = true
            }

            // 更新标题
            if (pubParmas.title !== undefined) {
              newParams.title = pubParmas.title
              needUpdate = true
            }

            // 更新视频（如果平台支持），使用 Object.hasOwn 以支持传入 undefined 清除视频
            if (Object.hasOwn(pubParmas, 'video') && platConfig.pubTypes.has(PubType.VIDEO)) {
              newParams.video = pubParmas.video
              needUpdate = true
            }

            // 更新图片（如果平台支持），使用 Object.hasOwn 以支持传入 undefined 清除图片
            if (Object.hasOwn(pubParmas, 'images') && platConfig.pubTypes.has(PubType.ImageText)) {
              newParams.images = pubParmas.images
              needUpdate = true
            }

            // 更新选项
            if (pubParmas.option) {
              newParams.option = lodash.merge({}, v.params.option, pubParmas.option)
              needUpdate = true
            }

            // 更新话题
            if (pubParmas.topics !== undefined) {
              newParams.topics = pubParmas.topics
              needUpdate = true
            }

            if (needUpdate) {
              pubList[i] = { ...v, params: newParams }
            }
          }

          pubListChoosed = pubListChoosed.map((v) => {
            const findData = pubList.find(k => k.account.id === v.account.id)
            if (findData)
              return findData
            return v
          })

          set({
            pubList,
            commonPubParams,
            pubListChoosed,
            expandedPubItem: get().expandedPubItem
              ? pubList.find(v => v.account.id === get().expandedPubItem!.account.id)
              : undefined,
          })
        },

        // 设置单个账号的参数（创建新对象引用，避免 memo 缓存导致 UI 不更新）
        setOnePubParams(pubParmas: Partial<IPubParams>, accountId: string) {
          const pubList = [...get().pubList]
          let pubListChoosed = [...get().pubListChoosed]
          const index = pubList.findIndex(v => v.account.id === accountId)
          if (index === -1)
            return

          const oldItem = pubList[index]
          const newParams = { ...oldItem.params }

          // 使用lodash的merge来正确处理嵌套对象
          if (pubParmas.option) {
            newParams.option = lodash.merge({}, oldItem.params.option, pubParmas.option)
          }

          for (const key in pubParmas) {
            if (Object.hasOwn(pubParmas, key) && key !== 'option') {
              ;(newParams as any)[key] = (pubParmas as any)[key]
            }
          }

          // 创建新的 PubItem 引用
          pubList[index] = { ...oldItem, params: newParams }

          // 同步更新未选中账号的参数
          for (let i = 0; i < pubList.length; i++) {
            if (i === index)
              continue
            const v = pubList[i]
            const platConfig = AccountPlatInfoMap.get(v.account.type)!
            if (!pubListChoosed.some(k => k.account.id === v.account.id)) {
              const updatedParams = { ...v.params }
              let needUpdate = false

              if (pubParmas.des !== undefined) {
                updatedParams.des = pubParmas.des || ''
                needUpdate = true
              }
              if (platConfig.pubTypes.has(PubType.VIDEO) && pubParmas.video) {
                updatedParams.video = pubParmas.video
                needUpdate = true
              }
              if (platConfig.pubTypes.has(PubType.ImageText) && pubParmas.images) {
                updatedParams.images = pubParmas.images
                needUpdate = true
              }

              if (needUpdate) {
                pubList[i] = { ...v, params: updatedParams }
              }
            }
          }

          pubListChoosed = pubListChoosed.map((v) => {
            const findData = pubList.find(k => k.account.id === v.account.id)
            if (findData)
              return findData
            return v
          })

          set({
            pubList,
            pubListChoosed,
            expandedPubItem: get().expandedPubItem
              ? pubList.find(v => v.account.id === get().expandedPubItem!.account.id)
              : undefined,
          })
        },
      }

      return methods
    },
  ),
)
