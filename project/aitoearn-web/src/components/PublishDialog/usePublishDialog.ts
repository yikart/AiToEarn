import type { SocialAccount } from '@/api/types/account.type'
import type { ErrPubParamsMapType } from '@/components/PublishDialog/hooks/usePubParamsVerify'
import type { IPlatOption, IPubParams, PubItem } from '@/components/PublishDialog/publishDialog.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { AccountStatus } from '@/app/config/accountConfig'
import {
  AccountPlatInfoMap,
  PlatType,
} from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { debugPublishDialog, getSocialAccountIdentityKeys, isSameSocialAccount } from '@/components/PublishDialog/PublishDialog.util'
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
      xhs: {},
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

function getDefaultContentCategory(params: Pick<IPubParams, 'video'>) {
  return params.video ? 'reel' : 'post'
}

function dedupePublishAccounts(accounts: SocialAccount[]) {
  return accounts.reduce<SocialAccount[]>((result, accountItem) => {
    const existingIndex = result.findIndex(item => isSameSocialAccount(item, accountItem))
    if (existingIndex === -1) {
      result.push(accountItem)
      return result
    }

    result[existingIndex] = accountItem
    return result
  }, [])
}

function normalizePlatformOptions(accountType: SocialAccount['type'], params: IPubParams): IPubParams {
  const option = { ...params.option }

  if (accountType === PlatType.Instagram && !option.instagram?.content_category) {
    option.instagram = {
      ...option.instagram,
      content_category: getDefaultContentCategory(params),
    }
  }

  if (accountType === PlatType.Facebook && !option.facebook?.content_category) {
    option.facebook = {
      ...option.facebook,
      content_category: getDefaultContentCategory(params),
    }
  }

  return {
    ...params,
    option,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function removeUndefinedFields(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const fieldKey of Object.keys(patch)) {
    if (patch[fieldKey] === undefined) {
      delete target[fieldKey]
      continue
    }

    const patchValue = patch[fieldKey]
    const targetValue = target[fieldKey]
    if (isRecord(patchValue) && isRecord(targetValue)) {
      removeUndefinedFields(targetValue, patchValue)
    }
  }
}

function removeUndefinedOptionFields(target: IPlatOption, patch: IPlatOption) {
  for (const platKey of Object.keys(patch) as Array<keyof IPlatOption>) {
    const platPatch = patch[platKey]

    if (platPatch === undefined) {
      delete target[platKey]
      continue
    }

    const platTarget = target[platKey]
    const patchRecord: unknown = platPatch
    const targetRecord: unknown = platTarget
    if (!isRecord(patchRecord) || !isRecord(targetRecord))
      continue

    removeUndefinedFields(targetRecord, patchRecord)
  }
}

function setPubItemIdentityMap(target: Map<string, PubItem>, pubItem: PubItem) {
  getSocialAccountIdentityKeys(pubItem.account).forEach((key) => {
    if (!target.has(key)) {
      target.set(key, pubItem)
    }
  })
}

function getPubItemByAccount(target: Map<string, PubItem>, account: SocialAccount) {
  for (const key of getSocialAccountIdentityKeys(account)) {
    const pubItem = target.get(key)
    if (pubItem)
      return pubItem
  }

  return undefined
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
          debugPublishDialog('store:clear', {
            stack: new Error('PublishDialog store clear').stack,
          })
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

          // 国外版过滤隐藏平台的账号
          const filteredAccounts = account

          filteredAccounts.map((v) => {
            pubList.push({
              account: v,
              params: methods.pubParamsInit(),
            })
          })

          if (defaultAccountIds && defaultAccountIds.length > 0) {
            // 过滤掉离线账号（status === 0）和区域不可用的平台
            const validIds = defaultAccountIds.filter((id) => {
              const acc = filteredAccounts.find(a => a.id === id)
              return acc && acc.status !== AccountStatus.DISABLE
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

        // 同步外部账号刷新结果，保留已编辑的发布参数
        syncAccounts(account: SocialAccount[]) {
          const filteredAccounts = dedupePublishAccounts(account)
          const currentPubList = get().pubList
          debugPublishDialog('syncAccounts:start', {
            incomingAccounts: filteredAccounts.map(accountItem => ({
              account: accountItem.account,
              id: accountItem.id,
              status: accountItem.status,
              type: accountItem.type,
              uid: accountItem.uid,
            })),
            pubList: currentPubList.map(pubItem => ({
              account: pubItem.account.account,
              id: pubItem.account.id,
              status: pubItem.account.status,
              type: pubItem.account.type,
              uid: pubItem.account.uid,
              hasContent: !!(
                pubItem.params.des
                || pubItem.params.video
                || pubItem.params.images?.length
              ),
            })),
            selectedIds: get().pubListChoosed.map(pubItem => pubItem.account.id),
          })
          if (filteredAccounts.length === 0 && currentPubList.length > 0) {
            return
          }

          const currentPubListChoosed = get().pubListChoosed
          const currentExpandedPubItem = get().expandedPubItem
          const currentPubItemMap = new Map<string, PubItem>()
          currentPubList.forEach((pubItem) => {
            setPubItemIdentityMap(currentPubItemMap, pubItem)
          })
          currentPubListChoosed.forEach((pubItem) => {
            setPubItemIdentityMap(currentPubItemMap, pubItem)
          })
          if (currentExpandedPubItem && !currentPubItemMap.has(currentExpandedPubItem.account.id)) {
            setPubItemIdentityMap(currentPubItemMap, currentExpandedPubItem)
          }

          const nextPubList = filteredAccounts.map((accountItem) => {
            const currentPubItem = getPubItemByAccount(currentPubItemMap, accountItem)
            if (!currentPubItem) {
              return {
                account: accountItem,
                params: methods.pubParamsInit(),
              }
            }

            return {
              ...currentPubItem,
              account: accountItem,
            }
          })
          const nextPubItemMap = new Map<string, PubItem>()
          nextPubList.forEach((pubItem) => {
            setPubItemIdentityMap(nextPubItemMap, pubItem)
          })
          const nextPubListChoosed = currentPubListChoosed
            .map(pubItem => getPubItemByAccount(nextPubItemMap, pubItem.account))
            .filter((pubItem): pubItem is PubItem => Boolean(pubItem))
          const nextExpandedPubItem = currentExpandedPubItem
            ? getPubItemByAccount(nextPubItemMap, currentExpandedPubItem.account)
            : undefined

          debugPublishDialog('syncAccounts:next', {
            nextPubList: nextPubList.map(pubItem => ({
              account: pubItem.account.account,
              id: pubItem.account.id,
              status: pubItem.account.status,
              type: pubItem.account.type,
              uid: pubItem.account.uid,
              hasContent: !!(
                pubItem.params.des
                || pubItem.params.video
                || pubItem.params.images?.length
              ),
            })),
            nextSelectedIds: nextPubListChoosed.map(pubItem => pubItem.account.id),
            nextExpandedId: nextExpandedPubItem?.account.id,
          })

          set({
            pubList: nextPubList,
            pubListChoosed: nextPubListChoosed,
            expandedPubItem: nextExpandedPubItem,
          })
        },

        // 参数设置到所有账户
        setAccountAllParams(pubParmas: Partial<IPubParams>) {
          const pubList = [...get().pubList]
          const commonPubParams = { ...get().commonPubParams }
          let pubListChoosed = [...get().pubListChoosed]

          // 更新 commonPubParams
          Object.assign(commonPubParams, pubParmas)

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
              const normalizedParams = normalizePlatformOptions(v.account.type, newParams)
              pubList[i] = { ...v, params: normalizedParams }
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
            // lodash.merge跳过undefined值，需要手动清除显式设为undefined的属性
            // 例如删除投票时 poll: undefined
            removeUndefinedOptionFields(newParams.option, pubParmas.option)
          }

          const { option: _option, ...paramPatch } = pubParmas
          Object.assign(newParams, paramPatch)

          const normalizedParams = normalizePlatformOptions(oldItem.account.type, newParams)

          // 创建新的 PubItem 引用
          pubList[index] = { ...oldItem, params: normalizedParams }

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
                const normalizedParamsForUnselected = normalizePlatformOptions(v.account.type, updatedParams)
                pubList[i] = { ...v, params: normalizedParamsForUnselected }
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
