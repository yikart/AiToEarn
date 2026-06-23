import type { IImgFile, IVideoFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { directTrans } from '@/app/i18n/client'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import { isPublishTitleSupported, isSameSocialAccount } from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { useAccountStore } from '@/store/account'
import { isPlatformEnabledSync, isPlatformMetadataReadySync } from '@/store/platformMetadata'
import { getOssUrl } from '@/utils/oss'
import { createPersistStore } from '@/utils/storage/createPersistStore'
import { confirm } from '@/utils/ui/confirm'

const RESTORE_CONFIRM_Z_INDEX = 10000

export interface IPublishDialogStorageStore {
  pubListChoosed?: PubItem[]
  expandedPubItem?: PubItem
  pubList?: PubItem[]
  desktopLayout?: PublishDialogDesktopLayout
  isDesktopDraftPanelOpen?: boolean
}

export interface PublishDialogDesktopLayout {
  draftPanelWidth: number
  publishPanelWidth: number
}

const state: IPublishDialogStorageStore = {
  // 实时保存的发布数据
  pubListChoosed: undefined,
  // 保存当前展开的数据
  expandedPubItem: undefined,
  // 实时保存的 所有发布列表
  pubList: undefined,
  // PC 端发布弹框双栏布局宽度
  desktopLayout: undefined,
  // PC 端发布弹框左侧 AI 内容创作栏是否展开
  isDesktopDraftPanelOpen: undefined,
}

const VIDEO_URL_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv'])

function getRestorableMediaUrl(url?: string) {
  const mediaUrl = url?.trim()
  if (!mediaUrl || mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:'))
    return undefined

  return mediaUrl
}

function getUploadedUrlFromTask(taskId?: string) {
  if (!taskId)
    return undefined

  const { tasks, md5Cache } = usePublishManageUpload.getState()
  const md5 = tasks[taskId]?.md5
  if (!md5)
    return undefined

  return md5Cache[md5]?.ossUrl
}

function getDisplayMediaUrl(ossUrl: string) {
  return getOssUrl(ossUrl) || ossUrl
}

function getMediaUrlExtension(url: string) {
  try {
    const parsedUrl = new URL(getDisplayMediaUrl(url), 'https://aitoearn.local')
    const extensionIndex = parsedUrl.pathname.lastIndexOf('.')
    return extensionIndex === -1 ? '' : parsedUrl.pathname.slice(extensionIndex).toLowerCase()
  }
  catch {
    return ''
  }
}

function isProbablyVideoUrl(url: string) {
  return VIDEO_URL_EXTENSIONS.has(getMediaUrlExtension(url))
}

function isSameMediaUrl(prevUrl: string | undefined, nextUrl: string | undefined) {
  if (!prevUrl || !nextUrl)
    return false

  return prevUrl === nextUrl || getDisplayMediaUrl(prevUrl) === getDisplayMediaUrl(nextUrl)
}

function normalizeRestoredImage(image: IImgFile, uploadTaskId = image.uploadTaskId): IImgFile | null {
  const ossUrl = getRestorableMediaUrl(image.ossUrl)
    ?? getRestorableMediaUrl(getUploadedUrlFromTask(uploadTaskId))
    ?? getRestorableMediaUrl(image.imgUrl)

  if (!ossUrl)
    return null

  const restoredImage: IImgFile = {
    ...image,
    ossUrl,
    imgUrl: getDisplayMediaUrl(ossUrl),
  }
  delete restoredImage.uploadTaskId

  return restoredImage
}

function getRestorableCoverUrl(video: IVideoFile, videoOssUrl: string) {
  const coverUrl = getRestorableMediaUrl(video.cover?.ossUrl)
    ?? getRestorableMediaUrl(getUploadedUrlFromTask(video.uploadTaskIds?.cover))
  if (coverUrl)
    return coverUrl

  const previewUrl = getRestorableMediaUrl(video.cover?.imgUrl)
  if (
    !previewUrl
    || isSameMediaUrl(previewUrl, videoOssUrl)
    || isSameMediaUrl(previewUrl, video.videoUrl)
    || isProbablyVideoUrl(previewUrl)
  ) {
    return undefined
  }

  return previewUrl
}

function normalizeRestoredCover(video: IVideoFile, videoOssUrl: string): IImgFile {
  const coverUrl = getRestorableCoverUrl(video, videoOssUrl)
  if (!coverUrl)
    return createFallbackCover(video, videoOssUrl)

  const originalCover = video.cover

  const restoredCover: IImgFile = {
    ...(originalCover ?? {}),
    id: originalCover?.id || `${video.filename || videoOssUrl}-cover`,
    size: originalCover?.size || 0,
    file: originalCover?.file || new File([], originalCover?.filename || `${video.filename || 'video'}-cover.jpg`),
    imgUrl: getDisplayMediaUrl(coverUrl),
    ossUrl: coverUrl,
    filename: originalCover?.filename || `${video.filename || 'video'}-cover.jpg`,
    imgPath: originalCover?.imgPath || '',
    width: originalCover?.width || video.width,
    height: originalCover?.height || video.height,
  }
  delete restoredCover.uploadTaskId

  return restoredCover
}

function createFallbackCover(video: IVideoFile, videoOssUrl: string): IImgFile {
  const filename = video.cover?.filename || `${video.filename || 'video'}-cover.jpg`
  const coverImgUrl = getRestorableMediaUrl(video.cover?.imgUrl)
  const imgUrl = coverImgUrl
    && !isSameMediaUrl(coverImgUrl, videoOssUrl)
    && !isSameMediaUrl(coverImgUrl, video.videoUrl)
    && !isProbablyVideoUrl(coverImgUrl)
    ? getDisplayMediaUrl(coverImgUrl)
    : ''

  return {
    id: video.cover?.id || `${video.filename || video.videoUrl}-cover`,
    size: video.cover?.size || 0,
    file: video.cover?.file || new File([], filename),
    imgUrl,
    filename,
    imgPath: video.cover?.imgPath || '',
    width: video.cover?.width || video.width,
    height: video.cover?.height || video.height,
  }
}

function normalizeRestoredVideo(video?: IVideoFile): IVideoFile | undefined {
  if (!video)
    return undefined

  const ossUrl = getRestorableMediaUrl(video.ossUrl)
    ?? getRestorableMediaUrl(getUploadedUrlFromTask(video.uploadTaskIds?.video))
    ?? getRestorableMediaUrl(video.videoUrl)

  if (!ossUrl)
    return undefined

  const cover = normalizeRestoredCover(video, ossUrl)
  const restoredVideo: IVideoFile = {
    ...video,
    ossUrl,
    videoUrl: getDisplayMediaUrl(ossUrl),
    cover,
  }
  delete restoredVideo.uploadTaskIds

  return restoredVideo
}

function mergeRestoredPubList(restoredPubList: PubItem[] | undefined, restoredChoosed: PubItem[]) {
  const currentPubList = usePublishDialog.getState().pubList
  const restoredPubListMap = new Map((restoredPubList ?? []).map(pubItem => [pubItem.account.id, pubItem]))
  const restoredChoosedMap = new Map(restoredChoosed.map(pubItem => [pubItem.account.id, pubItem]))
  const basePubList = currentPubList.length > 0 ? currentPubList : restoredPubList ?? []
  const mergedPubList = basePubList.map(pubItem => (
    restoredChoosedMap.get(pubItem.account.id)
    ?? restoredPubListMap.get(pubItem.account.id)
    ?? pubItem
  ))
  const mergedAccountIds = new Set(mergedPubList.map(pubItem => pubItem.account.id))

  restoredPubList?.forEach((pubItem) => {
    if (!mergedAccountIds.has(pubItem.account.id)) {
      mergedPubList.push(pubItem)
      mergedAccountIds.add(pubItem.account.id)
    }
  })

  restoredChoosed.forEach((pubItem) => {
    if (!mergedAccountIds.has(pubItem.account.id)) {
      mergedPubList.push(pubItem)
      mergedAccountIds.add(pubItem.account.id)
    }
  })

  return mergedPubList
}

function isPubItem(value: PubItem | null): value is PubItem {
  return Boolean(value)
}

function canUsePlatform(platType: PubItem['account']['type']) {
  if (!isPlatformMetadataReadySync())
    return true

  return isPlatformEnabledSync(platType)
}

function getLatestAccount(pubItem: PubItem) {
  const accountMap = useAccountStore.getState().accountMap
  return accountMap.get(pubItem.account.id)
    ?? Array.from(accountMap.values()).find(account => isSameSocialAccount(pubItem.account, account))
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
        const filteredList = pubListChoosed?.filter(pubItem => hasValidContent(pubItem) && canUsePlatform(pubItem.account.type))
        // 如果过滤后为空数组，则不存储
        if (!filteredList || filteredList.length === 0) {
          set({ pubListChoosed: undefined })
          return
        }
        set({ pubListChoosed: filteredList })
      },
      setPubListData(pubList?: PubItem[]) {
        // 过滤掉没有有效内容的项
        const filteredList = pubList?.filter(pubItem => hasValidContent(pubItem) && canUsePlatform(pubItem.account.type))
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

      setDesktopLayout(desktopLayout: PublishDialogDesktopLayout) {
        set({ desktopLayout })
      },

      setDesktopDraftPanelOpen(isDesktopDraftPanelOpen: boolean) {
        set({ isDesktopDraftPanelOpen })
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
          zIndex: RESTORE_CONFIRM_Z_INDEX,
          async onOk() {
            // 处理已选择的发布列表
            pubListChoosed = pubListChoosed
              ?.map(v => methods.processPubItem(v))
              .filter(isPubItem)

            if (!pubListChoosed || pubListChoosed.length === 0) {
              methods.clearPubData()
              return
            }

            // 处理所有发布列表
            let restoredPubList: PubItem[] | undefined
            if (pubList && pubList.length > 0) {
              restoredPubList = pubList.map(v => methods.processPubItem(v)).filter(isPubItem)
            }

            const mergedPubList = mergeRestoredPubList(restoredPubList, pubListChoosed)
            const expandedAccountId = expandedPubItem?.account.id
            const nextExpandedPubItem = expandedAccountId
              ? pubListChoosed.find(v => v.account.id === expandedAccountId) ?? pubListChoosed[0]
              : pubListChoosed[0]

            // 恢复数据
            const publishDialogStore = usePublishDialog.getState()
            publishDialogStore.setPubList(mergedPubList)
            publishDialogStore.setPubListChoosed(pubListChoosed)
            publishDialogStore.setStep(1)
            publishDialogStore.setExpandedPubItem(nextExpandedPubItem)
          },
          onCancel() {
            methods.clearPubData()
          },
        })
      },

      /**
       * 处理单个发布项：更新账户信息、过滤无效媒体资源
       * @param pubItem 发布项
       * @returns 处理后的发布项，如果账户不存在则返回null
       */
      processPubItem(pubItem: PubItem): PubItem | null {
        const account = getLatestAccount(pubItem)

        // 更新账户信息
        if (account && canUsePlatform(account.type)) {
          const nextParams = {
            ...pubItem.params,
            images: pubItem.params.images
              ?.map(img => normalizeRestoredImage(img))
              .filter((img): img is IImgFile => Boolean(img)),
            video: normalizeRestoredVideo(pubItem.params.video),
          }

          if (!isPublishTitleSupported(account.type))
            delete nextParams.title

          const nextPubItem = {
            ...pubItem,
            account,
            params: nextParams,
          }

          return hasValidContent(nextPubItem) ? nextPubItem : null
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
