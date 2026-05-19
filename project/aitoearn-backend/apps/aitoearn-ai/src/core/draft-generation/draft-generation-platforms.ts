import { AccountType } from '@yikart/common'

interface PlatformLimitRule {
  titleMaxLength?: number
  titleRequired?: boolean
  descMaxLength?: number
  descRequired?: boolean
  topicsMaxCount?: number
  topicsMinCount?: number
}

const PLATFORM_LIMIT_RULES: Record<string, PlatformLimitRule> = {
  [AccountType.TIKTOK]: { descMaxLength: 2200, topicsMaxCount: 5 },
  [AccountType.INSTAGRAM]: { descMaxLength: 2200 },
  [AccountType.Douyin]: { titleMaxLength: 30, topicsMaxCount: 5 },
  [AccountType.BILIBILI]: { titleMaxLength: 80, titleRequired: true, descMaxLength: 250, topicsMaxCount: 10, topicsMinCount: 1 },
  [AccountType.YOUTUBE]: { titleMaxLength: 100, titleRequired: true, descMaxLength: 5000, descRequired: true },
  [AccountType.TWITTER]: { descMaxLength: 280, descRequired: true },
  [AccountType.FACEBOOK]: { descMaxLength: 5000 },
  [AccountType.THREADS]: { descMaxLength: 500, descRequired: true },
  [AccountType.PINTEREST]: { titleRequired: true },
  [AccountType.KWAI]: { topicsMaxCount: 4 },
  [AccountType.Xhs]: { descMaxLength: 1000 },
  [AccountType.LINKEDIN]: { titleMaxLength: 200, descMaxLength: 3000 },
}

function checkPlatformLimits(
  platform: string,
  content: { title?: string, desc?: string, topics?: string[] },
): boolean {
  const rule = PLATFORM_LIMIT_RULES[platform]
  if (!rule)
    return true

  if (rule.titleRequired && !content.title?.trim())
    return false
  if (rule.titleMaxLength && (content.title?.length ?? 0) > rule.titleMaxLength)
    return false
  if (rule.descRequired && !content.desc?.trim())
    return false
  if (rule.descMaxLength && (content.desc?.length ?? 0) > rule.descMaxLength)
    return false

  const topicsCount = content.topics?.length ?? 0
  if (rule.topicsMinCount && topicsCount < rule.topicsMinCount)
    return false
  if (rule.topicsMaxCount && topicsCount > rule.topicsMaxCount)
    return false

  return true
}

interface PlatformMediaConstraints {
  video?: {
    minDuration?: number
    maxDuration?: number
    supportedRatios?: string[]
  }
  image?: {
    maxCount?: number
  }
}

const PLATFORM_MEDIA_CONSTRAINTS: Partial<Record<AccountType, PlatformMediaConstraints>> = {
  [AccountType.TIKTOK]: {
    video: { minDuration: 3, maxDuration: 600 },
    image: { maxCount: 10 },
  },
  [AccountType.INSTAGRAM]: {
    video: { minDuration: 5, maxDuration: 900 },
    image: { maxCount: 10 },
  },
  [AccountType.Douyin]: {
    video: { maxDuration: 900, supportedRatios: ['9:16', '16:9', '1:1'] },
    image: { maxCount: 9 },
  },
  [AccountType.BILIBILI]: {
    video: {},
  },
  [AccountType.YOUTUBE]: {
    video: { maxDuration: 43200 },
  },
  [AccountType.TWITTER]: {
    image: { maxCount: 4 },
  },
  [AccountType.FACEBOOK]: {
    video: { minDuration: 3, maxDuration: 14400 },
    image: { maxCount: 10 },
  },
  [AccountType.THREADS]: {
    video: { maxDuration: 300 },
    image: { maxCount: 20 },
  },
  [AccountType.PINTEREST]: {
    video: { minDuration: 4, maxDuration: 15 },
    image: {},
  },
  [AccountType.KWAI]: {
    video: { minDuration: 15, maxDuration: 180, supportedRatios: ['9:16'] },
  },
  [AccountType.Xhs]: {
    video: { maxDuration: 900, supportedRatios: ['9:16', '3:4', '1:1', '16:9'] },
    image: { maxCount: 9 },
  },
  [AccountType.WxGzh]: {
    image: {},
  },
  [AccountType.WxSph]: {
    video: {},
  },
  [AccountType.LINKEDIN]: {
    video: {},
    image: {},
  },
}

export interface DraftMediaInfo {
  type: 'video' | 'article'
  title?: string
  desc?: string
  topics?: string[]
  duration?: number
  aspectRatio?: string
  imageCount?: number
}

export function getCompatibleAccountTypes(info: DraftMediaInfo): AccountType[] {
  const platforms = Object.keys(PLATFORM_MEDIA_CONSTRAINTS) as AccountType[]

  return platforms.filter((platform) => {
    const mediaConstraints = PLATFORM_MEDIA_CONSTRAINTS[platform]
    if (!mediaConstraints) {
      return false
    }

    if (info.type === 'video') {
      const videoRule = mediaConstraints.video
      if (!videoRule) {
        return false
      }
      if (info.duration !== undefined) {
        if (videoRule.minDuration !== undefined && info.duration < videoRule.minDuration) {
          return false
        }
        if (videoRule.maxDuration !== undefined && info.duration > videoRule.maxDuration) {
          return false
        }
      }
      if (info.aspectRatio && videoRule.supportedRatios && !videoRule.supportedRatios.includes(info.aspectRatio)) {
        return false
      }
    }

    if (info.type === 'article') {
      const imageRule = mediaConstraints.image
      if (!imageRule) {
        return false
      }
      if (info.imageCount !== undefined && imageRule.maxCount !== undefined && info.imageCount > imageRule.maxCount) {
        return false
      }
    }

    return checkPlatformLimits(platform, {
      title: info.title,
      desc: info.desc,
      topics: info.topics,
    })
  })
}
