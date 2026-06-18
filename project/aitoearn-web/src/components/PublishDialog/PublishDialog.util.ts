import type { SocialAccount } from '@/api/accounts/account.types'
import type {
  ChannelCreatePublishFlowItem,
  ChannelCreatePublishFlowParams,
  ChannelPublishContentInput,
  ChannelPublishFlowVo,
  ChannelPublishSource,
} from '@/api/channels/channel.types'
import type { MediaItem, PromotionMaterial } from '@/api/materials/material.types'

import type { IImgFile, IPubParams, IVideoFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { generateUUID, getFilePathName, parseTopicString } from '@/utils/common'
import { getOssProxyPath, getOssUrl } from '@/utils/oss'

type AccountIdentityFields = Pick<SocialAccount, 'id' | 'type' | 'uid'>

export const PUBLISH_DIALOG_DND_TYPE = 'publish-dialog-draft-media'

export const PLATFORM_ACCOUNT_BORDER_COLORS: Record<PlatType, string> = {
  [PlatType.Tiktok]: 'oklch(67% 0.22 190)',
  [PlatType.Douyin]: 'oklch(64% 0.25 356)',
  [PlatType.Xhs]: 'oklch(58% 0.24 25)',
  [PlatType.WxSph]: 'oklch(65% 0.18 150)',
  [PlatType.KWAI]: 'oklch(66% 0.22 45)',
  [PlatType.YouTube]: 'oklch(56% 0.25 31)',
  [PlatType.BILIBILI]: 'oklch(72% 0.16 222)',
  [PlatType.Twitter]: 'oklch(58% 0.14 255)',
  [PlatType.WxGzh]: 'oklch(62% 0.17 135)',
  [PlatType.Facebook]: 'oklch(55% 0.2 265)',
  [PlatType.Instagram]: 'oklch(62% 0.26 330)',
  [PlatType.Threads]: 'oklch(57% 0.11 295)',
  [PlatType.Pinterest]: 'oklch(52% 0.23 18)',
  [PlatType.LinkedIn]: 'oklch(56% 0.17 240)',
}

export function getPlatformAccountBorderColor(platType: PlatType) {
  return PLATFORM_ACCOUNT_BORDER_COLORS[platType]
}

const VIDEO_COVER_MIME_TYPE = 'image/jpeg'
const VIDEO_COVER_FILE_EXTENSION = 'jpg'
const VIDEO_COVER_JPEG_QUALITY = 0.92

export type PublishDialogDragItem
  = | { kind: 'draft', material: PromotionMaterial }
    | { kind: 'media', media: MediaItem }

export function isPublishTitleSupported(platType: PlatType) {
  const platInfo = getPlatformInfoSync(platType)
  if (platInfo)
    return (platInfo.commonPubParamsConfig.titleMax ?? 0) > 0

  return [
    PlatType.WxGzh,
    PlatType.Xhs,
    PlatType.WxSph,
    PlatType.Douyin,
    PlatType.KWAI,
    PlatType.Pinterest,
    PlatType.LinkedIn,
    PlatType.YouTube,
    PlatType.BILIBILI,
  ].includes(platType)
}

export function getCommonPublishTitleMax(pubItems: PubItem[]) {
  const titleMaxList = pubItems
    .filter(item => isPublishTitleSupported(item.account.type))
    .map(item => getPlatformInfoSync(item.account.type)?.commonPubParamsConfig.titleMax)
    .filter((titleMax): titleMax is number => typeof titleMax === 'number' && titleMax > 0)

  if (titleMaxList.length === 0)
    return undefined

  return Math.min(...titleMaxList)
}

export function getSocialAccountIdentityKeys(account: AccountIdentityFields) {
  const keys = [`id:${account.id}`]

  if (account.uid) {
    keys.push(`uid:${account.type}:${account.uid}`)
  }

  return keys
}

export function isSameSocialAccount(
  prevAccount: AccountIdentityFields,
  nextAccount: AccountIdentityFields,
) {
  if (prevAccount.id === nextAccount.id)
    return true

  if (prevAccount.type !== nextAccount.type)
    return false

  if (prevAccount.uid && nextAccount.uid && prevAccount.uid === nextAccount.uid)
    return true

  return false
}

const INVALID_DESC_TOPIC_REGEX = /#(?:\s+\S+|\S*#\S*)/

export function hasInvalidDescTopicFormat(value: string) {
  return INVALID_DESC_TOPIC_REGEX.test(value)
}

export async function formatVideo(file: File): Promise<IVideoFile> {
  const videoUrl = URL.createObjectURL(file)
  const videoInfo = await VideoGrabFrame(videoUrl, 0)

  return {
    filename: file.name,
    videoUrl,
    size: file.size!,
    file,
    ...videoInfo,
  }
}

export function VideoGrabFrame(
  videoUrl: string,
  currentTime: number,
): Promise<{
  width: number
  height: number
  // 下取整的时长
  duration: number
  // 视频首帧
  cover: IImgFile
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    // 添加查询参数避免浏览器复用非 CORS 缓存（同一 URL 无 crossOrigin 的请求会污染缓存）
    const url = getOssUrl(videoUrl)
    video.src = url.startsWith('blob:') ? url : `${url}${url.includes('?') ? '&' : '?'}x-cors=1`

    // 设置超时
    const timeout = setTimeout(() => {
      video.remove()
      reject(new Error('视频加载超时'))
    }, 30000) // 30秒超时

    // 错误处理
    video.addEventListener('error', (e) => {
      clearTimeout(timeout)
      video.remove()
      reject(new Error(`视频加载失败: ${video.error?.message || '未知错误'}`))
    })

    // 当视频元数据加载完毕时执行回调
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = currentTime
    })

    video.addEventListener('seeked', () => {
      // 获取视频的宽度和高度
      const width = video.videoWidth
      const height = video.videoHeight
      // 获取视频的时长
      const duration = video.duration

      // 获取视频首帧
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')!
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      context.drawImage(video, 0, 0)

      // 尝试导出canvas，可能因为CORS失败
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            clearTimeout(timeout)
            video.remove()
            reject(new Error('Canvas转换为Blob失败'))
            return
          }

          try {
            const cover = await formatImg({
              blob,
              path: `cover.${VIDEO_COVER_FILE_EXTENSION}`,
            })
            clearTimeout(timeout)
            resolve({
              width,
              height,
              duration: Math.floor(duration),
              cover,
            })
            video.remove()
          }
          catch (formatError) {
            clearTimeout(timeout)
            video.remove()
            reject(new Error(`格式化封面失败: ${formatError}`))
          }
        }, VIDEO_COVER_MIME_TYPE, VIDEO_COVER_JPEG_QUALITY)
      }
      catch (canvasError) {
        clearTimeout(timeout)
        video.remove()
        reject(new Error(`Canvas操作失败（可能是CORS问题）: ${canvasError}`))
      }
    })

    // 加载视频
    video.load()
  })
}

export async function formatImg({
  path,
  file,
  blob,
}: {
  path: string
  file?: Uint8Array
  blob?: Blob
}): Promise<IImgFile> {
  return new Promise((resolve) => {
    const { filename, suffix } = getFilePathName(path)
    if (!blob) {
      // @ts-ignore
      blob = new Blob([file!], {
        type: `image/${suffix}`,
      })
    }
    const imgUrl = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      resolve({
        id: generateUUID(),
        width: img.width,
        height: img.height,
        imgPath: path,
        size: blob!.size,
        filename,
        file: new File([blob!], filename, { type: blob!.type }),
        imgUrl,
      })
    }
    img.src = imgUrl
  })
}

function getBlobSuffix(blob: Blob, fallback = 'png') {
  return blob.type.split('/')[1] || fallback
}

function getMediaFileName(title: string | undefined, fallback: string) {
  return title?.trim() || fallback
}

function appendTopicsToDescription(description: string, topics?: string[]) {
  if (!topics?.length)
    return description.trim()

  const { topics: descriptionTopics } = parseTopicString(description)
  const existingTopicKeys = new Set(descriptionTopics.map(getTopicKey))
  const appendedTopicKeys = new Set<string>()
  const topicStr = topics
    .flatMap((topic) => {
      const topicText = normalizeTopicText(topic)
      const topicKey = getTopicKey(topicText)
      if (!topicText || existingTopicKeys.has(topicKey) || appendedTopicKeys.has(topicKey))
        return []

      appendedTopicKeys.add(topicKey)
      return [`#${topicText}`]
    })
    .join(' ')

  if (!topicStr)
    return description.trim()

  return `${description}\n${topicStr}`.trim()
}

function getUniqueNormalizedTopics(topics: string[]) {
  const topicKeys = new Set<string>()
  const normalizedTopics: string[] = []

  for (const topic of topics) {
    const topicText = normalizeTopicText(topic)
    const topicKey = getTopicKey(topicText)
    if (!topicText || topicKeys.has(topicKey))
      continue

    topicKeys.add(topicKey)
    normalizedTopics.push(topicText)
  }

  return normalizedTopics
}

function buildDraftPublishText(description: string, topics?: string[]) {
  const { topics: descriptionTopics, cleanedString } = parseTopicString(description)
  const mergedTopics = getUniqueNormalizedTopics([...descriptionTopics, ...(topics || [])])

  return {
    des: appendTopicsToDescription(cleanedString, mergedTopics),
    topics: mergedTopics,
  }
}

export function createPublishImageFromUrl({
  url,
  id = generateUUID(),
  filename = '',
  width = 0,
  height = 0,
}: {
  url: string
  id?: string
  filename?: string
  width?: number
  height?: number
}): IImgFile {
  return {
    id,
    size: 0,
    file: new File([], filename),
    imgUrl: url,
    ossUrl: url || undefined,
    filename,
    imgPath: '',
    width,
    height,
  }
}

export async function createPublishImageFromMedia(media: MediaItem): Promise<IImgFile> {
  try {
    const ossUrl = getOssUrl(media.url)
    const req = await fetch(getOssProxyPath(ossUrl))
    const blob = await req.blob()
    const imageFile = await formatImg({
      blob,
      path: `${getMediaFileName(media.title, 'image')}.${getBlobSuffix(blob)}`,
    })
    imageFile.ossUrl = media.url
    return imageFile
  }
  catch {
    return createPublishImageFromUrl({
      id: `media-img-${media._id}`,
      url: media.url,
      filename: media.title || '',
    })
  }
}

export async function createPublishVideoFromMedia(media: MediaItem): Promise<IVideoFile> {
  const ossUrl = getOssUrl(media.url)
  let width = 0
  let height = 0
  let duration = Math.floor(media.metadata?.duration || 0)
  let cover = createPublishImageFromUrl({
    id: `media-cover-${media._id}`,
    url: media.thumbUrl || '',
    filename: media.title || '',
  })

  try {
    const videoInfo = await VideoGrabFrame(getOssProxyPath(ossUrl), 0)
    width = videoInfo.width
    height = videoInfo.height
    duration = videoInfo.duration
    cover = videoInfo.cover
  }
  catch {}

  if (media.thumbUrl) {
    try {
      const coverOss = getOssUrl(media.thumbUrl)
      const req = await fetch(getOssProxyPath(coverOss))
      const blob = await req.blob()
      cover = await formatImg({
        blob,
        path: `${getMediaFileName(media.title, 'cover')}_cover.${getBlobSuffix(blob)}`,
      })
      cover.ossUrl = media.thumbUrl
    }
    catch {}
  }

  return {
    ossUrl,
    videoUrl: ossUrl,
    file: new Blob([], { type: media.metadata?.mimeType || 'video/mp4' }),
    filename: getMediaFileName(media.title, `video_${Date.now()}.mp4`),
    width,
    height,
    duration,
    size: media.metadata?.size || 0,
    cover,
  }
}

async function createPublishVideoFromDraft(material: PromotionMaterial, videoUrl: string): Promise<IVideoFile> {
  try {
    const videoInfo = await VideoGrabFrame(videoUrl, 0)
    const cover = material.coverUrl
      ? createPublishImageFromUrl({
          url: material.coverUrl,
          width: videoInfo.width,
          height: videoInfo.height,
        })
      : videoInfo.cover

    return {
      size: 0,
      file: new Blob(),
      videoUrl,
      ossUrl: videoUrl,
      filename: '',
      width: videoInfo.width,
      height: videoInfo.height,
      duration: videoInfo.duration,
      cover,
    }
  }
  catch {
    return {
      size: 0,
      file: new Blob(),
      videoUrl,
      ossUrl: videoUrl,
      filename: '',
      width: 0,
      height: 0,
      duration: 0,
      cover: createPublishImageFromUrl({
        url: material.coverUrl || '',
      }),
    }
  }
}

export async function buildPublishParamsFromDraft(material: PromotionMaterial): Promise<Partial<IPubParams>> {
  const draftText = buildDraftPublishText(material.desc || '', material.topics)
  const params: Partial<IPubParams> = {
    des: draftText.des,
    title: material.title || '',
    topics: draftText.topics,
    video: undefined,
    images: [],
  }

  const videoMedia = material.mediaList?.find(media => media.type === 'video')
  if (videoMedia) {
    params.video = await createPublishVideoFromDraft(material, videoMedia.url)
    params.images = []
    return params
  }

  params.images = material.mediaList
    ?.filter(media => media.type === 'img')
    .map((media, index) => createPublishImageFromUrl({
      id: `draft-img-${index}`,
      url: media.url,
    })) || []

  return params
}

export async function buildPublishParamsFromMedia(
  media: MediaItem,
  currentImages: IImgFile[] = [],
): Promise<Partial<IPubParams>> {
  if (media.type === 'video') {
    return {
      video: await createPublishVideoFromMedia(media),
      images: [],
    }
  }

  return {
    video: undefined,
    images: [...currentImages, await createPublishImageFromMedia(media)],
  }
}

/**
 * 判断宽高是否属于指定比例（带缓冲阈值）
 * @param width 宽
 * @param height 高
 * @param ratio 目标比例（宽/高）
 * @param threshold 缓冲阈值，默认0.02
 */
export function isAspectRatioMatch(
  width: number,
  height: number,
  ratio: number,
  threshold: number = 0.02,
): boolean {
  if (height === 0)
    return false
  const actualRatio = width / height
  return Math.abs(actualRatio - ratio) <= threshold
}

/**
 * 判断宽高比是否在指定范围内（带缓冲阈值）
 * @param width 宽
 * @param height 高
 * @param minRatio 最小比例（宽/高）
 * @param maxRatio 最大比例（宽/高）
 * @param threshold 缓冲阈值，默认0.02
 */
export function isAspectRatioInRange(
  width: number,
  height: number,
  minRatio: number,
  maxRatio: number,
  threshold: number = 0.02,
): boolean {
  if (height === 0)
    return false
  const actualRatio = width / height
  return actualRatio >= minRatio - threshold && actualRatio <= maxRatio + threshold
}

function compactPublishOption(record: Record<string, unknown>) {
  const result: Record<string, unknown> = {}

  Object.entries(record).forEach(([key, value]) => {
    if (value === undefined || value === null)
      return
    if (Array.isArray(value) && value.length === 0)
      return
    result[key] = value
  })

  return Object.keys(result).length > 0 ? result : undefined
}

function normalizeTopicText(topic: string) {
  return topic
    .replace(/\[话题\]/g, '')
    .replace(/^#+/, '')
    .replace(/#+$/, '')
    .trim()
}

function getTopicKey(topic: string) {
  return normalizeTopicText(topic).toLowerCase()
}

export function buildChannelPublishBody(description?: string, topics?: string[]) {
  const { topics: descTopics, cleanedString } = parseTopicString(description || '')
  const mergedTopics = getUniqueNormalizedTopics([...descTopics, ...(topics || [])])

  return appendTopicsToDescription(cleanedString, mergedTopics)
}

function buildChannelPublishContent(
  params: IPubParams,
  options?: { includeTitle?: boolean },
): ChannelPublishContentInput {
  const videoUrl = params.video?.ossUrl
  const imageUrls = params.images
    ?.map(image => image.ossUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0) || []
  const media = videoUrl
    ? [{ url: videoUrl, metadata: { type: 'video' } }]
    : imageUrls.map(url => ({ url, metadata: { type: 'image' } }))
  const coverUrl = getChannelPublishCoverUrl(params)

  const content: ChannelPublishContentInput = {
    body: buildChannelPublishBody(params.des, params.topics),
    media,
    cover: coverUrl ? { url: coverUrl, metadata: { type: 'image' } } : undefined,
  }

  if (options?.includeTitle !== false)
    content.title = params.title || ''

  return content
}

function getChannelPublishImageUrls(params: IPubParams) {
  return params.images
    ?.map(image => image.ossUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0) || []
}

function getChannelPublishCoverUrl(params: IPubParams) {
  return params.video?.cover.ossUrl || getChannelPublishImageUrls(params)[0]
}

function buildBilibiliOption(item: PubItem) {
  const option = item.params.option.bilibili
  if (!option)
    return undefined

  return compactPublishOption({
    tid: option.tid,
    copyright: option.copyright,
    source: option.source,
  })
}

function buildFacebookOption(item: PubItem) {
  const option = item.params.option.facebook
  const contentCategory = item.params.video ? 'reel' : option?.content_category || 'post'

  return compactPublishOption({
    content_category: contentCategory,
  })
}

function buildInstagramOption(item: PubItem) {
  const option = item.params.option.instagram
  const contentCategory = item.params.video ? 'reel' : option?.content_category || 'post'
  const mediaType = option?.media_type || getInstagramMediaType(item, contentCategory)

  return compactPublishOption({
    content_category: contentCategory,
    media_type: mediaType,
  })
}

function getInstagramMediaType(item: PubItem, contentCategory: string) {
  if (contentCategory === 'reel')
    return 'REELS'

  if (item.params.video)
    return 'VIDEO'

  return (item.params.images?.length || 0) > 1 ? 'CAROUSEL' : 'IMAGE'
}

function buildYoutubeOption(item: PubItem) {
  const option = item.params.option.youtube
  if (!option)
    return undefined

  return compactPublishOption({
    privacyStatus: option.privacyStatus,
    license: option.license,
    categoryId: option.categoryId,
    notifySubscribers: option.notifySubscribers,
    embeddable: option.embeddable,
    selfDeclaredMadeForKids: option.selfDeclaredMadeForKids,
  })
}

function buildPinterestOption(item: PubItem) {
  const option = item.params.option.pinterest
  if (!option)
    return undefined

  const coverImageUrl = item.params.video
    ? option.coverImageUrl || getChannelPublishCoverUrl(item.params)
    : option.coverImageUrl

  return compactPublishOption({
    boardId: option.boardId,
    coverImageUrl,
  })
}

function buildTiktokOption(item: PubItem) {
  const option = item.params.option.tiktok
  if (!option)
    return undefined

  return compactPublishOption({
    privacy_level: option.privacy_level,
    disable_comment: option.comment_disabled,
    disable_duet: option.duet_disabled,
    disable_stitch: option.stitch_disabled,
    brand_organic_toggle: option.brand_organic_toggle,
    brand_content_toggle: option.brand_content_toggle,
  })
}

function buildThreadsOption(item: PubItem) {
  const option = item.params.option.threads
  if (!option)
    return undefined

  return compactPublishOption({
    location_id: option.location_id,
  })
}

function buildTwitterPollOption(item: PubItem) {
  const poll = item.params.option.twitter?.poll
  if (!poll)
    return undefined

  return compactPublishOption({
    options: poll.options.map(option => option.trim()).filter(Boolean),
    duration_minutes: poll.durationMinutes,
  })
}

function buildTwitterOption(item: PubItem) {
  const option = item.params.option.twitter
  if (!option)
    return undefined

  const altText = option.mediaMetadata
    ?.map(metadata => metadata.altText?.trim())
    .find((value): value is string => Boolean(value))

  return compactPublishOption({
    reply_settings: option.replySettings,
    poll: buildTwitterPollOption(item),
    made_with_ai: option.madeWithAi,
    alt_text: altText,
  })
}

export function buildChannelPublishOption(item: PubItem) {
  switch (item.account.type) {
    case 'bilibili':
      return buildBilibiliOption(item)
    case 'facebook':
      return buildFacebookOption(item)
    case 'instagram':
      return buildInstagramOption(item)
    case 'youtube':
      return buildYoutubeOption(item)
    case 'pinterest':
      return buildPinterestOption(item)
    case 'tiktok':
      return buildTiktokOption(item)
    case 'threads':
      return buildThreadsOption(item)
    case 'twitter':
      return buildTwitterOption(item)
    default:
      return undefined
  }
}

export interface BuildChannelPublishFlowParamsOptions {
  publishAt: string
  userTaskId?: string
  materialGroupId?: string
  materialId?: string
  source?: ChannelPublishSource
}

export function buildChannelPublishFlowParams(
  pubItems: PubItem[],
  options: BuildChannelPublishFlowParamsOptions,
): ChannelCreatePublishFlowParams | null {
  const firstItem = pubItems[0]
  if (!firstItem)
    return null

  const context: ChannelCreatePublishFlowParams['context'] = {}
  const videoUrl = firstItem.params.video?.ossUrl
  const imgUrlList = getChannelPublishImageUrls(firstItem.params)

  context.type = videoUrl ? PubType.VIDEO : PubType.ImageText
  if (videoUrl)
    context.videoUrl = videoUrl
  else
    context.imgUrlList = imgUrlList

  if (options.userTaskId)
    context.userTaskId = options.userTaskId
  if (options.materialGroupId)
    context.materialGroupId = options.materialGroupId
  if (options.materialId)
    context.materialId = options.materialId
  if (options.source)
    context.source = options.source

  const includeBaseTitle = pubItems.every(item => isPublishTitleSupported(item.account.type))
  const items: ChannelCreatePublishFlowItem[] = pubItems.map((item) => {
    const flowItem: ChannelCreatePublishFlowItem = {
      accountId: item.account.id,
      platform: item.account.type as PlatType,
      overrides: buildChannelPublishContent(item.params, {
        includeTitle: isPublishTitleSupported(item.account.type),
      }),
    }
    const option = buildChannelPublishOption(item)
    if (option)
      flowItem.option = option
    return flowItem
  })

  return {
    content: buildChannelPublishContent(firstItem.params, { includeTitle: includeBaseTitle }),
    publishAt: options.publishAt,
    context: Object.keys(context).length > 0 ? context : undefined,
    items,
  }
}

export function getPublishRecordIdFromFlow(flow?: ChannelPublishFlowVo, accountId?: string) {
  if (!flow?.tasks.length)
    return undefined

  if (!accountId)
    return flow.tasks[0]?.id

  return flow.tasks.find(task => task.accountId === accountId)?.id || flow.tasks[0]?.id
}
