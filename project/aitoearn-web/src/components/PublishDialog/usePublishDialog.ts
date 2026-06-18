import type { SocialAccount } from '@/api/accounts/account.types'
import type { ErrPubParamsMapType } from '@/components/PublishDialog/hooks/usePubParamsVerify'
import type { IPlatOption, IPubParams, PubItem } from '@/components/PublishDialog/publishDialog.type'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { AccountStatus } from '@/app/config/accountConfig'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { getSocialAccountIdentityKeys, isPublishTitleSupported, isSameSocialAccount } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { getPlatformInfoSync, isPlatformEnabledSync } from '@/store/platformMetadata'

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
  // 预填内容加载中
  prefillLoading: boolean
  // 发布内容添加加载中（草稿/素材拖拽导入）
  publishContentLoading: boolean
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
        content_category: undefined,
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
  prefillLoading: false,
  publishContentLoading: false,
}

interface SyncAccountsOptions {
  applyDefaultWhenEmpty?: boolean
}

function getStore() {
  return lodash.cloneDeep(store)
}

function getDefaultContentCategory(params: Pick<IPubParams, 'video'>) {
  return params.video ? 'reel' : 'post'
}

function getNormalizedContentCategory(currentCategory: string | undefined, params: Pick<IPubParams, 'video'>) {
  if (params.video)
    return 'reel'

  return currentCategory || getDefaultContentCategory(params)
}

function getVisiblePublishAccounts(account: SocialAccount[]) {
  return account.filter(v => isPlatformEnabledSync(v.type))
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
  const nextParams = { ...params }

  if (!isPublishTitleSupported(accountType))
    delete nextParams.title

  if (accountType === PlatType.Instagram) {
    option.instagram = {
      ...option.instagram,
      content_category: getNormalizedContentCategory(option.instagram?.content_category, params),
    }
  }

  if (accountType === PlatType.Facebook) {
    option.facebook = {
      ...option.facebook,
      content_category: getNormalizedContentCategory(option.facebook?.content_category, params),
    }
  }

  return {
    ...nextParams,
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

function normalizePubItem(pubItem: PubItem): PubItem {
  return {
    ...pubItem,
    params: normalizePlatformOptions(pubItem.account.type, pubItem.params),
  }
}

function mergePublishOptions(currentOption: IPlatOption, patchOption: IPlatOption) {
  const mergedOption = lodash.mergeWith(
    {},
    currentOption,
    patchOption,
    (_targetValue, patchValue) => {
      if (Array.isArray(patchValue))
        return [...patchValue]

      return undefined
    },
  ) as IPlatOption

  removeUndefinedOptionFields(mergedOption, patchOption)

  return mergedOption
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

function getDefaultChosenPubItems(pubList: PubItem[], defaultAccountIds?: string[]) {
  const defaultAccountIdSet = defaultAccountIds && defaultAccountIds.length > 0
    ? new Set(defaultAccountIds)
    : undefined

  return pubList.filter(pubItem => (
    (!defaultAccountIdSet || defaultAccountIdSet.has(pubItem.account.id))
    && pubItem.account.status !== AccountStatus.DISABLE
    && isPlatformEnabledSync(pubItem.account.type)
  ))
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
        setPublishContentLoading(publishContentLoading: boolean) {
          set({ publishContentLoading })
        },
        setPubListChoosed(pubListChoosed: PubItem[]) {
          set({
            pubListChoosed: pubListChoosed.map(normalizePubItem),
          })
        },
        setExpandedPubItem(expandedPubItem: PubItem | undefined) {
          if (!expandedPubItem) {
            usePublishDialogStorageStore.getState().setExpandedPubItem(undefined)
            set({ expandedPubItem: undefined })
            return
          }
          const normalizedExpandedPubItem = normalizePubItem(expandedPubItem)
          usePublishDialogStorageStore.getState().setExpandedPubItem(normalizedExpandedPubItem)
          set({
            expandedPubItem: normalizedExpandedPubItem,
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
          set({ pubList: pubList.map(normalizePubItem) })
        },

        // 清空所有数据
        clear() {
          set({
            ...getStore(),
          })
        },

        // 初始化发布参数
        pubParamsInit(accountType?: SocialAccount['type']): IPubParams {
          const params = lodash.cloneDeep(get().commonPubParams)
          return accountType ? normalizePlatformOptions(accountType, params) : params
        },

        /**
         * 初始化
         * @param account 账户列表
         * @param defaultAccountIds 默认选中的账户Id列表
         */
        init(account: SocialAccount[], defaultAccountIds?: string[]) {
          const pubList: PubItem[] = []
          let hasSelected = false

          // 国外版过滤隐藏平台的账号
          const filteredAccounts = getVisiblePublishAccounts(account)

          filteredAccounts.map((v) => {
            pubList.push({
              account: v,
              params: methods.pubParamsInit(v.type),
            })
          })

          const chosen = getDefaultChosenPubItems(pubList, defaultAccountIds)
          if (chosen.length > 0) {
            methods.setPubListChoosed(chosen)
            hasSelected = chosen.length > 0

            // 如果只有一个，设置为 expandedPubItem
            if (chosen.length === 1) {
              set({ expandedPubItem: chosen[0] })
            }
          }

          set({
            pubList,
          })

          return hasSelected
        },

        // 同步外部账号刷新结果，保留已编辑的发布参数
        syncAccounts(account: SocialAccount[], defaultAccountIds?: string[], options?: SyncAccountsOptions) {
          const filteredAccounts = dedupePublishAccounts(getVisiblePublishAccounts(account))
          const currentPubList = get().pubList
          if (filteredAccounts.length === 0 && currentPubList.length > 0) {
            return get().pubListChoosed.length > 0
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
                params: methods.pubParamsInit(accountItem.type),
              }
            }

            return {
              ...currentPubItem,
              account: accountItem,
              params: normalizePlatformOptions(accountItem.type, currentPubItem.params),
            }
          })
          const nextPubItemMap = new Map<string, PubItem>()
          nextPubList.forEach((pubItem) => {
            setPubItemIdentityMap(nextPubItemMap, pubItem)
          })
          let nextPubListChoosed = currentPubListChoosed
            .map(pubItem => getPubItemByAccount(nextPubItemMap, pubItem.account))
            .filter((pubItem): pubItem is PubItem => Boolean(pubItem))
          if (options?.applyDefaultWhenEmpty && nextPubListChoosed.length === 0) {
            nextPubListChoosed = getDefaultChosenPubItems(nextPubList, defaultAccountIds)
          }

          const nextExpandedPubItem = nextPubListChoosed.length === 1
            ? nextPubListChoosed[0]
            : currentExpandedPubItem
              ? getPubItemByAccount(nextPubItemMap, currentExpandedPubItem.account)
              : undefined

          set({
            pubList: nextPubList,
            pubListChoosed: nextPubListChoosed,
            expandedPubItem: nextExpandedPubItem,
          })

          return nextPubListChoosed.length > 0
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
            const platConfig = getPlatformInfoSync(v.account.type)
            if (!platConfig)
              continue
            const newParams = { ...v.params }
            let needUpdate = false

            // 更新描述
            if (pubParmas.des !== undefined) {
              newParams.des = pubParmas.des
              needUpdate = true
            }

            // 更新标题
            if (pubParmas.title !== undefined && isPublishTitleSupported(v.account.type)) {
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
              newParams.option = mergePublishOptions(v.params.option, pubParmas.option)
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

          if (pubParmas.option) {
            newParams.option = mergePublishOptions(oldItem.params.option, pubParmas.option)
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
            const platConfig = getPlatformInfoSync(v.account.type)
            if (!platConfig)
              continue
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
