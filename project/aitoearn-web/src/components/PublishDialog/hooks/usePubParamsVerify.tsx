import type { PlatformInfo, PlatformMediaRules } from '@/api/channels/channel.types'
import type { IImgFile, IVideoFile, PubItem } from '@/components/PublishDialog/publishDialog.type'
import { AlertTriangle } from 'lucide-react'
import { memo, useMemo } from 'react'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { useTransClient } from '@/app/i18n/client'
import { getTwitterPublishValidationMessages } from '@/components/PublishDialog/compoents/PlatParamsSetting/plats/TwitterParams/validation'
import { UploadTaskStatusEnum } from '@/components/PublishDialog/compoents/PublishManageUpload/publishManageUpload.enum'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import {
  buildChannelPublishBody,
  hasInvalidDescTopicFormat,
  isAspectRatioInRange,
  isAspectRatioMatch,
  isPublishTitleSupported,
} from '@/components/PublishDialog/PublishDialog.util'
import { usePlatformInfoMap } from '@/hooks/usePlatformMetadata'
import { getFilePathName, parseTopicString } from '@/utils/common'
import { formatFileSize, getDurationPartsFromSeconds } from '@/utils/format'

export interface ErrPubParamsItem {
  // 参数错误提示消息（兼容旧版，显示第一个错误）
  parErrMsg?: string
  // 所有错误消息列表
  parErrMsgs?: string[]
  // 错误状态
  errStatus?: boolean
}

export type ErrPubParamsMapType = Map<string | number, ErrPubParamsItem>

const BACKEND_TOPIC_PATTERN = /#([\w\p{Script=Han}]+)/gu

const FLOW_VALIDATION_EXCLUDED_PLATFORMS = new Set<PlatType>([
  PlatType.Xhs,
  PlatType.WxSph,
])

function normalizeTopicText(topic: string) {
  return topic.replace(/^#+/, '').replace(/\s+/g, '')
}

function getTopicKey(topic: string) {
  return normalizeTopicText(topic).toLowerCase()
}

function getUniqueTopics(topics: string[]) {
  const seen = new Set<string>()
  const uniqueTopics: string[] = []

  for (const topic of topics) {
    const normalizedTopic = normalizeTopicText(topic)
    const topicKey = normalizedTopic.toLowerCase()
    if (!topicKey || seen.has(topicKey))
      continue

    seen.add(topicKey)
    uniqueTopics.push(normalizedTopic)
  }

  return uniqueTopics
}

function getTopicTotalLength(topics: string[]) {
  return topics.reduce((total, topic) => total + normalizeTopicText(topic).length, 0)
}

function hasDuplicateTopics(topics: string[]) {
  const seen = new Set<string>()
  for (const topic of topics) {
    const topicKey = getTopicKey(topic)
    if (!topicKey)
      continue
    if (seen.has(topicKey))
      return true
    seen.add(topicKey)
  }
  return false
}

function hasOversizedImage(images: IImgFile[] | undefined, maxSize: number | undefined) {
  if (typeof maxSize !== 'number')
    return false

  return images?.some(img => img.size > maxSize) ?? false
}

function isVideoSizeExceeded(video: IVideoFile | undefined, maxSize: number | undefined) {
  if (typeof maxSize !== 'number')
    return false

  return Boolean(video && video.size > maxSize)
}

function isVideoDurationOutOfRange(
  video: IVideoFile | undefined,
  maxDuration: number | undefined,
  minDuration: number | undefined,
) {
  if (!video)
    return false

  const isOverMax = typeof maxDuration === 'number' && video.duration > maxDuration
  const isUnderMin = typeof minDuration === 'number' && video.duration < minDuration

  return isOverMax || isUnderMin
}

function stripTopicsFromBody(body: string) {
  return body
    .replace(BACKEND_TOPIC_PATTERN, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getBodyForLength(body: string, platInfo: PlatformInfo) {
  return platInfo.topic.nativeField ? stripTopicsFromBody(body) : body
}

function getStringArrayRule(mediaRules: PlatformMediaRules, key: string) {
  const value = mediaRules[key]
  if (!Array.isArray(value))
    return undefined

  const items = value.filter((item): item is string => typeof item === 'string')
  return items.length > 0 ? items : undefined
}

function getNumberRule(mediaRules: PlatformMediaRules, key: keyof PlatformMediaRules) {
  const value = mediaRules[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

type TranslateFn = (key: string, options?: Record<string, number | string>) => string

function getDurationLimitLabel(seconds: number, t: TranslateFn) {
  const durationParts = getDurationPartsFromSeconds(seconds)
  const segments: string[] = []

  if (durationParts.hours > 0) {
    segments.push(t('validation.durationLimitHours', { value: durationParts.hours }))
  }
  if (durationParts.minutes > 0) {
    segments.push(t('validation.durationLimitMinutes', { value: durationParts.minutes }))
  }
  if (durationParts.seconds > 0 || segments.length === 0) {
    segments.push(t('validation.durationLimitSeconds', { value: durationParts.seconds }))
  }

  return segments.join(t('validation.durationLimitSeparator'))
}

function getMimeExtension(type: string | undefined) {
  if (!type)
    return ''

  const [category, subtype] = type.toLowerCase().split('/')
  if ((category !== 'image' && category !== 'video') || !subtype)
    return ''
  if (subtype === 'quicktime')
    return 'mov'
  return subtype.replace(/^x-/, '')
}

function getPathExtension(path: string | undefined) {
  if (!path)
    return ''

  const pathWithoutQuery = path.split(/[?#]/)[0]
  const { filename, suffix } = getFilePathName(pathWithoutQuery)
  if (!filename.includes('.'))
    return ''
  return suffix.toLowerCase()
}

function getFirstPathExtension(paths: Array<string | undefined>) {
  for (const path of paths) {
    const extension = getPathExtension(path)
    if (extension)
      return extension
  }
  return ''
}

function getImageExtension(image: IImgFile) {
  return getMimeExtension(image.file?.type) || getFirstPathExtension([
    image.filename,
    image.imgPath,
    image.ossUrl,
    image.imgUrl,
  ])
}

function getVideoExtension(video: IVideoFile) {
  return getMimeExtension(video.file?.type) || getFirstPathExtension([
    video.filename,
    video.ossUrl,
    video.videoUrl,
  ])
}

function hasUnsupportedImageFormat(images: IImgFile[] | undefined, allowedFormats: string[] | undefined) {
  if (!images?.length || !allowedFormats?.length)
    return false

  const allowed = new Set(allowedFormats.map(format => format.toLowerCase()))
  return images.some((image) => {
    const extension = getImageExtension(image)
    return Boolean(extension) && !allowed.has(extension)
  })
}

function hasUnsupportedVideoFormat(video: IVideoFile | undefined, allowedFormats: string[] | undefined) {
  if (!video || !allowedFormats?.length)
    return false

  const extension = getVideoExtension(video)
  if (!extension)
    return false

  return !allowedFormats.map(format => format.toLowerCase()).includes(extension)
}

function hasTextContent(params: PubItem['params'], bodyForLength: string, titleSupported: boolean) {
  return Boolean(bodyForLength || (titleSupported && params.title))
}

function getFacebookAllowedFormats(contentCategory: string | undefined) {
  if (contentCategory === 'reel') {
    return { videoFormats: ['mp4'] }
  }
  if (contentCategory === 'story') {
    return {
      imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
      videoFormats: ['mp4', 'mov'],
    }
  }
  return {
    imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
    videoFormats: ['mp4', 'mov', 'avi'],
  }
}

function getInstagramMentionCount(body: string) {
  return body.match(/(^|[^\w.])@([\w.]+)/g)?.length ?? 0
}

/**
 * 发布参数校验是否复合平台规范
 * @param data
 */
export default function usePubParamsVerify(data: PubItem[]) {
  console.log(data)
  const { t } = useTransClient('publish', { useSuspense: false })
  const platformInfoMap = usePlatformInfoMap()

  const tasks = usePublishManageUpload(state => state.tasks)

  // 错误参数，发布之前会检测错误参数，防止平台无法发布
  const errParamsMap = useMemo(() => {
    const errParamsMapTemp: ErrPubParamsMapType = new Map()
    for (const v of data) {
      const platInfo = platformInfoMap.get(v.account.type)
      if (!platInfo)
        continue
      const { topics } = parseTopicString(v.params.des || '')
      const paramsTopics = v.params.topics ?? []
      const topicsAll = getUniqueTopics(paramsTopics.concat(topics))
      const { titleMax, topicMax, topicMaxTotalLength } = platInfo.commonPubParamsConfig
      const video = v.params.video
      const publishBody = buildChannelPublishBody(v.params.des, v.params.topics)
      const bodyForLength = getBodyForLength(publishBody, platInfo)
      const titleSupported = isPublishTitleSupported(v.account.type)
      const textSupported = platInfo.pubTypes.has(PubType.Article)
      const imageTextSupported = platInfo.pubTypes.has(PubType.ImageText)
      const videoSupported = platInfo.pubTypes.has(PubType.VIDEO)
      const images = v.params.images ?? []
      const shouldValidateFlowRules = !FLOW_VALIDATION_EXCLUDED_PLATFORMS.has(v.account.type)

      // 收集当前账号的所有错误
      const errors: string[] = []
      const addErrorMsg = (msg: string) => {
        if (errors.includes(msg))
          return
        errors.push(msg)
      }

      // ------------------------  通用参数校验  ------------------------

      // 媒体上传完成校验（阻止在上传未完成时发布）
      const hasImages = (v.params.images?.length || 0) > 0
      const hasVideo = Boolean(v.params.video)

      const isImageUploaded = (img: IImgFile) => {
        return (
          !!img.ossUrl
          || (img.uploadTaskId && tasks[img.uploadTaskId]?.status === UploadTaskStatusEnum.Success)
        )
      }

      const isVideoUploaded = (vd: IVideoFile | undefined) => {
        const videoOk
          = !!vd?.ossUrl
            || (vd?.uploadTaskIds?.video
              && tasks[vd.uploadTaskIds.video]?.status === UploadTaskStatusEnum.Success)

        const hasCoverUploadTask = Boolean(vd?.cover?.uploadTaskId || vd?.uploadTaskIds?.cover)
        const coverOk
          = !hasCoverUploadTask
            || !!vd?.cover?.ossUrl
            || (vd?.uploadTaskIds?.cover
              && tasks[vd.uploadTaskIds.cover]?.status === UploadTaskStatusEnum.Success)
        return videoOk && coverOk
      }

      if (hasImages) {
        const notFinished = (v.params.images || []).some(img => !isImageUploaded(img))
        if (notFinished) {
          addErrorMsg(t('upload.finishingUp'))
        }
      }

      if (hasVideo) {
        if (!isVideoUploaded(v.params.video)) {
          addErrorMsg(t('upload.finishingUp'))
        }
      }

      if (hasImages && hasVideo) {
        addErrorMsg(t('validation.imageVideoMixed'))
      }

      if (shouldValidateFlowRules && hasImages && !imageTextSupported) {
        addErrorMsg(t('validation.imageContentUnsupported', { platformName: platInfo.name }))
      }

      if (shouldValidateFlowRules && hasVideo && !videoSupported) {
        addErrorMsg(t('validation.videoContentUnsupported', { platformName: platInfo.name }))
      }

      if (shouldValidateFlowRules && !hasImages && !hasVideo && hasTextContent(v.params, bodyForLength, titleSupported) && !textSupported) {
        addErrorMsg(t('validation.textContentUnsupported', { platformName: platInfo.name }))
      }

      const maxTotalTextLength = platInfo.contentLimits.maxTotalTextLength
      if (shouldValidateFlowRules && typeof maxTotalTextLength === 'number') {
        const totalTextLength = (titleSupported ? (v.params.title?.length ?? 0) : 0) + bodyForLength.length
        if (totalTextLength > maxTotalTextLength) {
          addErrorMsg(
            t('validation.totalTextMaxExceeded', {
              platformName: platInfo.name,
              maxCount: maxTotalTextLength,
            }),
          )
        }
      }

      const imageFormats = getStringArrayRule(platInfo.mediaRules, 'imageFormats')
      const videoFormats = getStringArrayRule(platInfo.mediaRules, 'videoFormats')
      const imageMaxSize = getNumberRule(platInfo.mediaRules, 'maxImageSize')
      const videoMaxSize = getNumberRule(platInfo.mediaRules, 'maxVideoSize')
      const videoMinDuration = getNumberRule(platInfo.mediaRules, 'minVideoDuration')
      const videoMaxDuration = getNumberRule(platInfo.mediaRules, 'maxVideoDuration')

      if (shouldValidateFlowRules && hasUnsupportedImageFormat(v.params.images, imageFormats)) {
        addErrorMsg(t('validation.imageFormatUnsupported', { formats: imageFormats?.join(', ') ?? '' }))
      }
      if (shouldValidateFlowRules && hasUnsupportedVideoFormat(video, videoFormats)) {
        addErrorMsg(t('validation.videoFormatUnsupported', { formats: videoFormats?.join(', ') ?? '' }))
      }
      if (typeof imageMaxSize === 'number' && hasOversizedImage(v.params.images, imageMaxSize)) {
        addErrorMsg(t('validation.imageSizeExceeded', {
          platformName: platInfo.name,
          maxSize: formatFileSize(imageMaxSize),
        }))
      }
      if (typeof videoMaxSize === 'number' && isVideoSizeExceeded(video, videoMaxSize)) {
        addErrorMsg(t('validation.videoSizeExceeded', {
          platformName: platInfo.name,
          maxSize: formatFileSize(videoMaxSize),
        }))
      }
      if (isVideoDurationOutOfRange(video, videoMaxDuration, videoMinDuration)) {
        addErrorMsg(
          typeof videoMinDuration === 'number' && typeof videoMaxDuration === 'number'
            ? t('validation.videoDurationRangeExceeded', {
                platformName: platInfo.name,
                minDuration: getDurationLimitLabel(videoMinDuration, t),
                maxDuration: getDurationLimitLabel(videoMaxDuration, t),
              })
            : t('validation.videoDurationMaxExceeded', {
                platformName: platInfo.name,
                maxDuration: getDurationLimitLabel(videoMaxDuration ?? videoMinDuration ?? 0, t),
              }),
        )
      }

      // 描述校验
      if (
        (v.account.type === PlatType.Threads
          || v.account.type === PlatType.Twitter
          || v.account.type === PlatType.KWAI)
        && !v.params.des
      ) {
        addErrorMsg(t('validation.descriptionRequired'))
      }

      // 标题字数校验
      if (isPublishTitleSupported(v.account.type) && titleMax !== undefined && v.params.title && v.params.title.length > titleMax) {
        addErrorMsg(
          t('validation.titleMaxExceeded', {
            platformName: platInfo.name,
            maxCount: titleMax,
          }),
        )
      }

      // 描述字数校验
      if (bodyForLength && bodyForLength.length > platInfo.commonPubParamsConfig.desMax) {
        addErrorMsg(
          t('validation.descriptionMaxExceeded', {
            platformName: platInfo.name,
            maxCount: platInfo.commonPubParamsConfig.desMax,
          }),
        )
      }

      // 图片数量校验
      if (
        platInfo.pubTypes.has(PubType.ImageText)
        && images.length > 1
        && images.length > platInfo.commonPubParamsConfig.imagesMax!
      ) {
        addErrorMsg(
          t('validation.imageMaxExceeded', {
            platformName: platInfo.name,
            maxCount: platInfo.commonPubParamsConfig.imagesMax,
          }),
        )
      }

      // 图片或者视频校验，视频和图片必须要上传一个
      if (
        !platInfo.pubTypes.has(PubType.Article)
        && !hasImages
        && !v.params.video
      ) {
        let msgs = t('validation.uploadImageOrVideo')
        if (platInfo.pubTypes.has(PubType.ImageText) && platInfo.pubTypes.has(PubType.VIDEO)) {
          msgs = t('validation.uploadImageOrVideo')
        }
        else if (platInfo.pubTypes.has(PubType.ImageText)) {
          msgs = t('validation.uploadImage')
        }
        else if (platInfo.pubTypes.has(PubType.VIDEO)) {
          msgs = t('validation.uploadVideo')
        }
        addErrorMsg(msgs)
      }

      // 话题支持与数量校验：maxCount 缺省表示不限制，supported=false 表示不支持话题
      if (!platInfo.topic.supported && topicsAll.length > 0) {
        addErrorMsg(
          t('validation.topicUnsupported', {
            platformName: platInfo.name,
          }),
        )
      }

      if (platInfo.topic.supported && topicMax !== undefined && topicsAll.length > topicMax) {
        addErrorMsg(
          t('validation.topicMaxExceeded', {
            platformName: platInfo.name,
            maxCount: topicMax,
          }),
        )
      }

      if (hasDuplicateTopics(paramsTopics) || hasDuplicateTopics(topics)) {
        addErrorMsg(t('validation.topicDuplicate'))
      }

      if (
        platInfo.topic.supported
        && topicMaxTotalLength !== undefined
        && getTopicTotalLength(topicsAll) > topicMaxTotalLength
      ) {
        addErrorMsg(
          t('validation.topicTotalLengthExceeded', {
            platformName: platInfo.name,
            max: topicMaxTotalLength,
          }),
        )
      }

      // 判断描述中的话题格式是否正确，如：#话题1#话题2 或 # 话题 这种格式错误
      if (hasInvalidDescTopicFormat(v.params.des || '')) {
        addErrorMsg(t('validation.topicFormatError'))
      }

      // ------------------------  单个平台参数校验  ------------------------

      // b站的强制校验
      if (v.account.type === PlatType.BILIBILI) {
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        if (topicsAll.length === 0) {
          addErrorMsg(t('validation.topicRequired'))
        }
        if (!v.params.option.bilibili?.tid) {
          addErrorMsg(t('validation.partitionRequired'))
        }
        if (v.params.option.bilibili?.copyright === 2 && !v.params.option.bilibili.source) {
          addErrorMsg(t('validation.sourceRequired'))
        }
      }

      // facebook的强制校验
      if (v.account.type === PlatType.Facebook) {
        const contentCategory = v.params.option.facebook?.content_category
        const facebookFormats = getFacebookAllowedFormats(contentCategory)
        if (hasUnsupportedImageFormat(v.params.images, facebookFormats.imageFormats)) {
          addErrorMsg(t('validation.imageFormatUnsupported', { formats: facebookFormats.imageFormats?.join(', ') ?? '' }))
        }
        if (hasUnsupportedVideoFormat(video, facebookFormats.videoFormats)) {
          addErrorMsg(t('validation.videoFormatUnsupported', { formats: facebookFormats.videoFormats?.join(', ') ?? '' }))
        }

        switch (v.params.option.facebook?.content_category) {
          case 'post':
            break
          case 'reel':
            if (!video) {
              addErrorMsg(t('validation.uploadVideo'))
            }
            if ((v.params.images?.length || 0) !== 0) {
              addErrorMsg(t('validation.facebookReelNoImage'))
            }
            break
          case 'story':
            if (!hasImages && !video) {
              addErrorMsg(t('validation.uploadImageOrVideo'))
            }
            if ((v.params.images?.length || 0) + (video ? 1 : 0) > 1) {
              addErrorMsg(t('validation.facebookStoryMediaMax'))
            }
            // facebook story 只能选择图片、视频，不能有描述
            if (v.params.des) {
              addErrorMsg(t('validation.facebookStoryNoDes'))
            }
            if (v.params.title) {
              addErrorMsg(t('validation.facebookStoryNoTitle'))
            }
            if (v.params.option.facebook?.link) {
              addErrorMsg(t('validation.facebookStoryNoLink'))
            }
            break
        }
      }

      // instagram的强制校验
      if (v.account.type === PlatType.Instagram) {
        if (getInstagramMentionCount(publishBody) > 20) {
          addErrorMsg(t('validation.instagramMentionMax'))
        }

        // 图片比例判断
        if (
          v.params.option.instagram?.content_category === 'post'
          && v.params.images
          && v.params.images.length > 0
        ) {
          for (const img of v.params.images) {
            // Instagram Post 图片比例范围：4:5 ~ 1.91:1 (0.8 ~ 1.91)
            if (!isAspectRatioInRange(img.width, img.height, 4 / 5, 1.91)) {
              addErrorMsg(t('validation.instagramImageValidation'))
              break
            }
          }
        }

        switch (v.params.option.instagram?.content_category) {
          case 'post':
            // instagram post不能上传视频，必须上传图片
            if (video) {
              addErrorMsg(t('validation.instagramPostNoVideo'))
            }
            break
          case 'reel':
            if (!video) {
              addErrorMsg(t('validation.uploadVideo'))
            }
            // instagram reel 不能上传图片，必须上传视频 1
            if ((v.params.images?.length || 0) !== 0) {
              addErrorMsg(t('validation.instagramReelNoImage'))
            }
            // instagram reel 视频宽高比限制：4:5 ~ 9:16 (0.8 ~ 0.5625)
            if (video && !isAspectRatioInRange(video.width, video.height, 9 / 16, 4 / 5)) {
              addErrorMsg(t('validation.instagramReelAspectRatio'))
            }
            break
          case 'story':
            // instagram story 只能选择图片/视频，不能有描述
            if (v.params.des) {
              addErrorMsg(t('validation.instagramStoryNoDes'))
            }
            break
        }
      }

      if (v.account.type === PlatType.Threads) {
        if (!hasImages && !video && !bodyForLength) {
          addErrorMsg(t('validation.descriptionRequired'))
        }
      }

      // Pinterest 的强制校验
      if (v.account.type === PlatType.Pinterest) {
        // 强制需要标题
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        // 强制需要 选择Board
        if (!v.params.option.pinterest?.boardId) {
          addErrorMsg(t('validation.boardRequired'))
        }
        if (video && !v.params.video?.cover.ossUrl && !v.params.option.pinterest?.coverImageUrl) {
          addErrorMsg(t('validation.coverRequired'))
        }
      }

      // YouTube 的强制校验
      if (v.account.type === PlatType.YouTube) {
        // 强制需要标题
        if (!v.params.title) {
          addErrorMsg(t('validation.titleRequired'))
        }
        // 强制需要描述
        if (!v.params.des) {
          addErrorMsg(t('validation.descriptionRequired'))
        }
        // 强制需要选择视频分类
        if (!v.params.option.youtube?.categoryId) {
          addErrorMsg(t('validation.categoryRequired'))
        }
      }

      // TikTok 的强制校验
      if (v.account.type === PlatType.Tiktok) {
        if ((v.params.images?.length || 0) === 1) {
          addErrorMsg(t('validation.tiktokImageMin'))
        }
        // TikTok 图片最小高度和宽度为 360 像素
        if (v.params.images) {
          for (const img of v.params.images) {
            if (img.width < 360 || img.height < 360) {
              addErrorMsg(t('validation.tiktokImageMinResolution'))
              break
            }
          }
        }
        // TikTok 内容披露校验：开启披露但未选择任何选项
        const tiktokOption = v.params.option.tiktok
        // TikTok 隐私级别必填校验
        if (!tiktokOption?.privacy_level) {
          addErrorMsg(t('validation.tiktokPrivacyLevelRequired'))
        }
        if (
          tiktokOption?.brand_disclosure_enabled === true
          && !tiktokOption?.brand_organic_toggle
          && !tiktokOption?.brand_content_toggle
        ) {
          addErrorMsg(t('validation.tiktokContentDisclosureRequired'))
        }
      }

      // Twitter 的强制校验
      if (v.account.type === PlatType.Twitter) {
        getTwitterPublishValidationMessages(v.params, t).forEach(addErrorMsg)
      }

      // 如果有错误，保存到 Map 中
      if (errors.length > 0) {
        errParamsMapTemp.set(v.account.id, {
          parErrMsg: errors[0], // 兼容旧版，显示第一个错误
          parErrMsgs: errors, // 所有错误
        })
      }
    }
    return errParamsMapTemp
  }, [data, platformInfoMap, t, tasks])

  // 警告参数，警告参数不会阻止发布，只是提示用户可能存在的问题
  const warningParamsMap = useMemo(() => {
    const warningParamsMapTemp: ErrPubParamsMapType = new Map()

    for (const v of data) {
      // 收集当前账号的所有警告
      const warnings: string[] = []
      const addWarningMsg = (msg: string) => {
        warnings.push(msg)
      }

      // YouTube 警告消息
      if (v.account.type === PlatType.YouTube) {
        // 建议分辨率：1920×1080（16:9）或 1080×1920（9:16）。
        if (v.params.video) {
          const video = v.params.video
          if (
            !isAspectRatioMatch(video.width, video.height, 16 / 9)
            && !isAspectRatioMatch(video.width, video.height, 9 / 16)
          ) {
            addWarningMsg(t('validation.youtubeResolutionSuggestion'))
          }
        }
      }

      // 快手 警告消息
      if (v.account.type === PlatType.KWAI) {
        // 推荐分辨率：1080x1920（竖屏）
        if (v.params.video) {
          const video = v.params.video
          if (!isAspectRatioMatch(video.width, video.height, 9 / 16)) {
            addWarningMsg(t('validation.kwaiResolutionSuggestion'))
          }
        }
        // 时长建议：15 秒 - 3 分钟
        if (v.params.video) {
          const video = v.params.video
          if (video.duration < 15 || video.duration > 180) {
            addWarningMsg(t('validation.kwaiDurationSuggestion'))
          }
        }
      }

      // 如果有警告，保存到 Map 中
      if (warnings.length > 0) {
        warningParamsMapTemp.set(v.account.id, {
          parErrMsg: warnings[0], // 兼容旧版，显示第一个警告
          parErrMsgs: warnings, // 所有警告
        })
      }
    }
    return warningParamsMapTemp
  }, [data, t])

  return {
    errParamsMap,
    warningParamsMap,
  }
}

// 用于展示校验的结果
export const PubParamsVerifyInfo = memo(({ errItem }: { errItem?: ErrPubParamsItem }) => {
  return (
    <>
      {errItem && (
        <div className="flex items-start gap-2 mb-4 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-xs">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-left text-yellow-800 dark:text-yellow-200">{errItem.parErrMsg}</p>
        </div>
      )}
    </>
  )
})
