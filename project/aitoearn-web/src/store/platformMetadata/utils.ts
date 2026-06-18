import type {
  PlatformInfo,
  PlatformInfoTuple,
  PlatformMediaRules,
  PlatformMetadataVo,
} from '@/api/channels/channel.types'
import { PlatformStatus, PublishContentMode } from '@/api/channels/channel.constants'
import { PlatType } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { isChineseLanguage } from '@/app/i18n/languageConfig'
import { getStaticPlatformIcon } from '@/store/platformMetadata/staticIcons'

export const TASK_EXCLUDED_PLATFORMS = new Set<PlatType>([
  PlatType.WxSph,
  PlatType.WxGzh,
  PlatType.Pinterest,
  PlatType.LinkedIn,
])

const COLLECT_UNSUPPORTED_PLATFORMS = new Set<PlatType>([
  PlatType.Facebook,
  PlatType.Instagram,
  PlatType.Twitter,
])

const VIEW_UNSUPPORTED_PLATFORMS = new Set<PlatType>([
  PlatType.Xhs,
])

const platformValues = new Set<string>(Object.values(PlatType))

const DEFAULT_PLATFORM_DISPLAY_NAMES: Record<PlatType, Partial<Record<string, string>>> = {
  [PlatType.Tiktok]: {
    'en': 'TikTok',
    'en-US': 'TikTok',
    'zh-CN': 'TikTok',
  },
  [PlatType.Douyin]: {
    'en': 'Douyin',
    'en-US': 'Douyin',
    'zh-CN': '抖音',
  },
  [PlatType.Xhs]: {
    'en': 'RedNote',
    'en-US': 'RedNote',
    'zh-CN': '小红书',
  },
  [PlatType.WxSph]: {
    'en': 'WeChat Channels',
    'en-US': 'WeChat Channels',
    'zh-CN': '微信视频号',
  },
  [PlatType.KWAI]: {
    'en': 'Kwai',
    'en-US': 'Kwai',
    'zh-CN': '快手',
  },
  [PlatType.YouTube]: {
    'en': 'YouTube',
    'en-US': 'YouTube',
    'zh-CN': 'YouTube',
  },
  [PlatType.BILIBILI]: {
    'en': 'Bilibili',
    'en-US': 'Bilibili',
    'zh-CN': '哔哩哔哩',
  },
  [PlatType.Twitter]: {
    'en': 'Twitter（X）',
    'en-US': 'Twitter（X）',
    'zh-CN': 'Twitter（X）',
  },
  [PlatType.WxGzh]: {
    'en': 'WeChat Official Account',
    'en-US': 'WeChat Official Account',
    'zh-CN': '微信公众号',
  },
  [PlatType.Facebook]: {
    'en': 'Facebook',
    'en-US': 'Facebook',
    'zh-CN': 'Facebook',
  },
  [PlatType.Instagram]: {
    'en': 'Instagram',
    'en-US': 'Instagram',
    'zh-CN': 'Instagram',
  },
  [PlatType.Threads]: {
    'en': 'Threads',
    'en-US': 'Threads',
    'zh-CN': 'Threads',
  },
  [PlatType.Pinterest]: {
    'en': 'Pinterest',
    'en-US': 'Pinterest',
    'zh-CN': 'Pinterest',
  },
  [PlatType.LinkedIn]: {
    'en': 'LinkedIn',
    'en-US': 'LinkedIn',
    'zh-CN': 'LinkedIn',
  },
}

const CHINESE_UNTRANSLATED_NAME_ALIASES: Partial<Record<PlatType, Set<string>>> = {
  [PlatType.Douyin]: new Set(['douyin']),
  [PlatType.Xhs]: new Set(['rednote', 'xiaohongshu', 'xhs']),
  [PlatType.WxSph]: new Set(['wechat channels', 'wechat channel', 'wxsph']),
  [PlatType.KWAI]: new Set(['kwai']),
  [PlatType.BILIBILI]: new Set(['bilibili']),
  [PlatType.WxGzh]: new Set(['wechat official account', 'wechat official accounts', 'wxgzh']),
}

function getNumberFromRules(rules: PlatformMediaRules, key: string) {
  const value = rules[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getOptionalNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function isPlatType(value: string): value is PlatType {
  return platformValues.has(value)
}

export function isTaskPlatformSupported(platType: PlatType) {
  return !TASK_EXCLUDED_PLATFORMS.has(platType)
}

export function isPlatCollectSupported(platType: PlatType) {
  return !COLLECT_UNSUPPORTED_PLATFORMS.has(platType)
}

export function isPlatViewSupported(platType: PlatType) {
  return !VIEW_UNSUPPORTED_PLATFORMS.has(platType)
}

export function isPlatformAvailable<T extends Pick<PlatformInfo, 'status'>>(item?: T | null): item is T {
  return item?.status === PlatformStatus.Available
}

export function isPlatformComingSoon<T extends Pick<PlatformInfo, 'status'>>(item?: T | null): item is T {
  return item?.status === PlatformStatus.ComingSoon
}

export function isPlatformRegionLimited<T extends Pick<PlatformInfo, 'status'>>(item?: T | null): item is T {
  return item?.status === PlatformStatus.Unavailable
}

export function isPlatformVisible<T extends Pick<PlatformInfo, 'status'>>(item?: T | null): item is T {
  return !!item
}

const CHANNEL_PLATFORM_STATUS_ORDER: Record<PlatformStatus, number> = {
  [PlatformStatus.Available]: 0,
  [PlatformStatus.Unavailable]: 1,
  [PlatformStatus.ComingSoon]: 2,
}

function getChannelPlatformStatusOrder(item: Pick<PlatformInfo, 'status'>) {
  return CHANNEL_PLATFORM_STATUS_ORDER[item.status]
}

function compareChannelPlatformStatus(left: PlatformInfo, right: PlatformInfo) {
  return getChannelPlatformStatusOrder(left) - getChannelPlatformStatusOrder(right)
}

export function getPlatformDisplayName(item: PlatformMetadataVo, lng: string) {
  if (isChineseLanguage(lng)) {
    const displayName = getDisplayNameByLocale(item, ['zh-CN', 'zh', lng])
    const fallbackName = DEFAULT_PLATFORM_DISPLAY_NAMES[item.platform]?.['zh-CN']

    if (!displayName)
      return fallbackName ?? item.displayName['en-US'] ?? item.platform
    if (fallbackName && isUntranslatedChinesePlatformName(item.platform, displayName))
      return fallbackName

    return displayName
  }

  return getDisplayNameByLocale(item, getLocaleCandidates(lng))
    ?? getDefaultPlatformDisplayName(item.platform, lng)
    ?? item.platform
}

function getDisplayNameByLocale(item: PlatformMetadataVo, locales: string[]) {
  for (const locale of locales) {
    const value = item.displayName[locale]
    if (value)
      return value
  }

  return undefined
}

function getLocaleCandidates(lng: string) {
  const normalizedLng = lng.replace('_', '-')
  const baseLng = normalizedLng.split('-')[0]
  const candidates = [lng, normalizedLng, baseLng]

  if (baseLng === 'en')
    candidates.push('en-US')
  candidates.push('en-US', 'zh-CN')

  return Array.from(new Set(candidates))
}

function getDefaultPlatformDisplayName(platform: PlatType, lng: string) {
  const defaultNames = DEFAULT_PLATFORM_DISPLAY_NAMES[platform]
  if (!defaultNames)
    return undefined

  const candidates = isChineseLanguage(lng) ? ['zh-CN'] : getLocaleCandidates(lng)
  for (const locale of candidates) {
    const value = defaultNames[locale]
    if (value)
      return value
  }

  return undefined
}

function getLocalizedPlatformText(values: PlatformMetadataVo['authInstructions'], lng: string) {
  if (!values)
    return undefined

  for (const locale of getLocaleCandidates(lng)) {
    const value = values[locale]
    if (value)
      return value
  }

  return undefined
}

function isUntranslatedChinesePlatformName(platform: PlatType, displayName: string) {
  const normalizedName = displayName.trim().toLowerCase()
  return CHINESE_UNTRANSLATED_NAME_ALIASES[platform]?.has(normalizedName) === true
}

function getPubTypeFromContentMode(mode: string) {
  switch (mode) {
    case PubType.VIDEO:
      return PubType.VIDEO
    case PubType.ImageText:
    case PublishContentMode.ImageText:
      return PubType.ImageText
    case PubType.Article:
    case PublishContentMode.Text:
      return PubType.Article
    default:
      return undefined
  }
}

function derivePubTypes(item: PlatformMetadataVo) {
  const pubTypes = new Set<PubType>()
  const modes = item.contentLimits.modes

  if (item.capabilities.publish.supported === false)
    return pubTypes

  if (!modes) {
    pubTypes.add(PubType.VIDEO)
    pubTypes.add(PubType.ImageText)
    pubTypes.add(PubType.Article)
    return pubTypes
  }

  for (const mode of modes) {
    const pubType = getPubTypeFromContentMode(mode)
    if (pubType)
      pubTypes.add(pubType)
  }

  return pubTypes
}

export function normalizePlatformMetadata(item: PlatformMetadataVo, lng: string): PlatformInfo {
  const maxImages = item.contentLimits.maxImages ?? getNumberFromRules(item.mediaRules, 'maxImages')
  const titleMax = getOptionalNumber(item.contentLimits.maxTitleLength)
  const topicMax = item.topic.supported ? getOptionalNumber(item.topic.maxCount) : 0
  const topicMaxTotalLength = getOptionalNumber(item.topic.maxTotalLength)
    ?? getOptionalNumber(item.contentLimits.maxTotalTextLength)

  return {
    type: item.platform,
    platform: item.platform,
    status: item.status,
    name: getPlatformDisplayName(item, lng),
    icon: item.logoUrl || getStaticPlatformIcon(item.platform) || '',
    logoUrl: item.logoUrl || getStaticPlatformIcon(item.platform) || '',
    authType: item.authType,
    authInstruction: getLocalizedPlatformText(item.authInstructions, lng),
    editor: item.editor,
    capabilities: item.capabilities,
    contentLimits: item.contentLimits,
    mediaRules: item.mediaRules,
    topic: item.topic,
    optionSchema: item.optionSchema,
    defaultOption: item.defaultOption,
    commonPubParamsConfig: {
      titleMax,
      topicMax,
      topicMaxTotalLength,
      desMax: item.contentLimits.maxBodyLength ?? 0,
      imagesMax: maxImages,
    },
    pubTypes: derivePubTypes(item),
  }
}

export function normalizePlatformMetadataList(items: PlatformMetadataVo[], lng: string) {
  const list = items.map(item => normalizePlatformMetadata(item, lng))
  const map = new Map<PlatType, PlatformInfo>()
  list.forEach((item) => {
    map.set(item.type, item)
  })

  return { list, map }
}

export function platformInfoListToTuples(list: PlatformInfo[]): PlatformInfoTuple[] {
  return list.map(item => [item.type, item])
}

export function getEnabledPlatformInfos(list: PlatformInfo[]) {
  return list.filter(isPlatformAvailable)
}

export function getTaskPlatformInfos(list: PlatformInfo[]) {
  return list.filter(item => isPlatformAvailable(item) && isTaskPlatformSupported(item.type))
}

export function getPublishPlatformInfos(list: PlatformInfo[]) {
  return list.filter(item => isPlatformAvailable(item) && item.capabilities.publish.supported !== false && item.pubTypes.size > 0)
}

export function getChannelPlatformInfos(list: PlatformInfo[]) {
  return list
    .filter(isPlatformVisible)
    .map((item, index) => ({ item, index }))
    .sort((left, right) => compareChannelPlatformStatus(left.item, right.item) || left.index - right.index)
    .map(({ item }) => item)
}
