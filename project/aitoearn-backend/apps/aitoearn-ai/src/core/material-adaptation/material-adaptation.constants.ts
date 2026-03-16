import { AccountType } from '@yikart/common'
import { z } from 'zod'

// 平台限制规则接口
export interface PlatformLimitRule {
  titleMaxLength?: number
  titleRequired?: boolean
  descMaxLength?: number
  descRequired?: boolean
  topicsMaxCount?: number
  topicsMinCount?: number
}

// 结构化平台限制规则（用于预检查）
export const PLATFORM_LIMIT_RULES: Record<string, PlatformLimitRule> = {
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

// 需要 AI 生成必填配置的平台
export const PLATFORMS_REQUIRING_CONFIG: AccountType[] = [AccountType.BILIBILI, AccountType.YOUTUBE]

/**
 * 检查内容是否符合指定平台的限制
 * @returns true 表示符合，false 表示不符合
 */
export function checkPlatformLimits(
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

export const PLATFORM_RESTRICTIONS = new Map<string, string>([
  [AccountType.TIKTOK, 'Topics≤5; Desc≤2200; Video 3-600s, ≤1GB, ≥360px; Images≤10, ≤20MB, 1080x1920.'],
  [AccountType.INSTAGRAM, 'Title≤2200; Images: ≤10, ratio 4:5-1.91:1, ≤8MB; Video≤100MB; Post=images only; Reel=video 5-900s; Story=no desc.'],
  [AccountType.Douyin, 'Topics≤5; Title≤30; Desc+Topics≤1000; Images≤9; Video≤1GB, ≤15min, 9:16/16:9/1:1.'],
  [AccountType.BILIBILI, 'Title<80; Desc<250; Title required; topics≤10; ≥1 hashtag; tid required; if reprint, source required.'],
  [AccountType.YOUTUBE, 'Title required ≤100; Desc required ≤5000; categoryId required; Video≤256GB, ≤12h.'],
  [AccountType.TWITTER, 'Desc required ≤280; Images≤4, ≤5MB, ≤8192px.'],
  [AccountType.FACEBOOK, 'Desc≤5000; Video: Reels 3-90s, Posts≤4h, Stories 3-60s; ≤1GB; 16:9-9:16; Image: 1-10, ≤10MB.'],
  [AccountType.THREADS, 'Desc≤500; Video≤1GB, ≤300s, MOV/MP4; Images: 1-20, ≤8MB each; Desc required.'],
  [AccountType.PINTEREST, 'Title & Board required; Video 4-15s, ≤1GB; Image≤10MB.'],
  [AccountType.KWAI, 'Topics≤4; Video: MP4/MOV, recommended 9:16, 15-180s.'],
  [AccountType.Xhs, 'Images≤9, ≥300x600; Video≤300MB, ≤15min, ≥720p, 9:16/3:4/1:1/16:9; Text≤1000.'],
  [AccountType.WxGzh, 'Article format; supports text, images, and videos.'],
  [AccountType.WxSph, 'Video format; supports short videos.'],
  [AccountType.LINKEDIN, 'Professional content; Title≤200; Desc≤3000.'],
])

/**
 * 结构化平台媒体约束（从 PLATFORM_RESTRICTIONS 提取）
 * 用于根据生成内容的实际属性判断该素材适用于哪些平台
 */
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

/**
 * 根据生成内容的实际属性，匹配 PLATFORM_RESTRICTIONS 中各平台的约束，
 * 返回该素材兼容的 AccountType 列表
 */
export function getCompatibleAccountTypes(info: DraftMediaInfo): AccountType[] {
  const platforms = [...PLATFORM_RESTRICTIONS.keys()] as AccountType[]

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

const BilibiliOptionSchema = z.object({
  tid: z.number().describe('分区ID'),
  copyright: z.number().optional().describe('版权类型: 1=原创, 2=转载'),
  no_reprint: z.number().optional().describe('禁止转载: 0=允许, 1=禁止'),
  source: z.string().optional().describe('转载来源链接'),
})

const YoutubeOptionSchema = z.object({
  categoryId: z.string().describe('分类ID'),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).optional().describe('隐私状态'),
  license: z.enum(['youtube', 'creativeCommon']).optional().describe('许可证'),
})

const TiktokOptionSchema = z.object({
  privacy_level: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']).optional().describe('隐私级别'),
})

const FacebookOptionSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().describe('内容类型'),
})

const InstagramOptionSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().describe('内容类型'),
})

const ThreadsOptionSchema = z.object({
  location_id: z.string().nullable().optional().describe('位置ID'),
})

const BaseOutputSchema = z.object({
  title: z.string().describe('标题'),
  desc: z.string().describe('描述'),
  topics: z.array(z.string()).describe('话题标签'),
})

const TiktokOutputSchema = BaseOutputSchema.extend({
  topics: z.array(z.string()).max(5).describe('话题标签'),
  option: TiktokOptionSchema.optional(),
})

const InstagramOutputSchema = BaseOutputSchema.extend({
  option: InstagramOptionSchema.optional(),
})

const DouyinOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const BilibiliOutputSchema = BaseOutputSchema.extend({
  option: BilibiliOptionSchema.optional(),
})

const YoutubeOutputSchema = BaseOutputSchema.extend({
  option: YoutubeOptionSchema.optional(),
})

const TwitterOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const FacebookOutputSchema = BaseOutputSchema.extend({
  option: FacebookOptionSchema.optional(),
})

const ThreadsOutputSchema = BaseOutputSchema.extend({
  option: ThreadsOptionSchema.optional(),
})

const PinterestOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const KwaiOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const XhsOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const WxGzhOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const WxSphOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

const LinkedinOutputSchema = BaseOutputSchema.extend({
  option: z.any().optional(),
})

export const PLATFORM_SCHEMAS = {
  [AccountType.TIKTOK]: TiktokOutputSchema,
  [AccountType.INSTAGRAM]: InstagramOutputSchema,
  [AccountType.Douyin]: DouyinOutputSchema,
  [AccountType.BILIBILI]: BilibiliOutputSchema,
  [AccountType.YOUTUBE]: YoutubeOutputSchema,
  [AccountType.TWITTER]: TwitterOutputSchema,
  [AccountType.FACEBOOK]: FacebookOutputSchema,
  [AccountType.THREADS]: ThreadsOutputSchema,
  [AccountType.PINTEREST]: PinterestOutputSchema,
  [AccountType.KWAI]: KwaiOutputSchema,
  [AccountType.Xhs]: XhsOutputSchema,
  [AccountType.WxGzh]: WxGzhOutputSchema,
  [AccountType.WxSph]: WxSphOutputSchema,
  [AccountType.LINKEDIN]: LinkedinOutputSchema,
  [AccountType.GOOGLE_BUSINESS]: LinkedinOutputSchema,
} as const

type PlatformSchemas = typeof PLATFORM_SCHEMAS
type PlatformKey = keyof PlatformSchemas

type BuildOutputSchema<T extends readonly PlatformKey[]> = z.ZodObject<{
  [K in T[number]]: PlatformSchemas[K]
}>

export function buildDynamicOutputSchema<T extends readonly PlatformKey[]>(
  platforms: T,
): BuildOutputSchema<T> {
  const schemaShape = {} as { [K in T[number]]: PlatformSchemas[K] }
  for (const platform of platforms) {
    const schema = PLATFORM_SCHEMAS[platform as PlatformKey]
    if (schema) {
      (schemaShape as Record<string, unknown>)[platform] = schema
    }
  }
  return z.object(schemaShape) as BuildOutputSchema<T>
}

// 配置专用的 schema（只包含 option 字段）
const BilibiliConfigOnlySchema = z.object({
  option: BilibiliOptionSchema.pick({ tid: true, copyright: true, no_reprint: true }),
})

const YoutubeConfigOnlySchema = z.object({
  option: YoutubeOptionSchema.pick({ categoryId: true, privacyStatus: true }),
})

const CONFIG_ONLY_SCHEMAS: Partial<Record<AccountType, z.ZodObject<{ option: z.ZodObject<z.ZodRawShape> }>>> = {
  [AccountType.BILIBILI]: BilibiliConfigOnlySchema,
  [AccountType.YOUTUBE]: YoutubeConfigOnlySchema,
}

/**
 * 构建只生成配置的 schema
 */
export function buildConfigOnlySchema(platforms: AccountType[]): z.ZodObject<Record<string, z.ZodObject<{ option: z.ZodObject<z.ZodRawShape> }>>> {
  const schemaShape: Record<string, z.ZodObject<{ option: z.ZodObject<z.ZodRawShape> }>> = {}
  for (const platform of platforms) {
    const schema = CONFIG_ONLY_SCHEMAS[platform]
    if (schema) {
      schemaShape[platform] = schema
    }
  }
  return z.object(schemaShape) as z.ZodObject<Record<string, z.ZodObject<{ option: z.ZodObject<z.ZodRawShape> }>>>
}
