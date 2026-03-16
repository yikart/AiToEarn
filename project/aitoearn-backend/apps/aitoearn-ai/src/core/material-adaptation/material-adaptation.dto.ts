import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const AdaptMaterialDtoSchema = z.object({
  materialId: z.string().min(1).describe('素材 ID'),
  platforms: z.array(z.enum(AccountType)).min(1).describe('目标平台列表'),
})

export class AdaptMaterialDto extends createZodDto(AdaptMaterialDtoSchema, 'AdaptMaterialDto') { }

export const UpdateMaterialAdaptationDtoSchema = z.object({
  title: z.string().optional().describe('平台标题'),
  desc: z.string().optional().describe('平台描述'),
  topics: z.array(z.string()).optional().describe('话题标签'),
})

export class UpdateMaterialAdaptationDto extends createZodDto(
  UpdateMaterialAdaptationDtoSchema,
  'UpdateMaterialAdaptationDto',
) { }

export const BilibiliOptionsSchema = z.object({
  tid: z.number().int().positive().optional().describe('分区 ID'),
  no_reprint: z.number().int().optional().describe('禁止转载标志'),
  copyright: z.number().int().optional().describe('原创/转载标志 (1=原创, 2=转载)'),
  source: z.string().optional().describe('转载来源链接'),
})

export const YoutubeOptionsSchema = z.object({
  privacyStatus: z.enum(['public', 'unlisted', 'private']).optional().describe('隐私状态'),
  license: z.enum(['youtube', 'creativeCommon']).optional().describe('许可证类型'),
  categoryId: z.string().optional().describe('分类 ID'),
  notifySubscribers: z.boolean().optional().describe('通知订阅者'),
  embeddable: z.boolean().optional().describe('允许嵌入'),
  selfDeclaredMadeForKids: z.boolean().optional().describe('面向儿童内容'),
})

export const TiktokOptionsSchema = z.object({
  privacy_level: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']).optional().describe('隐私级别'),
  comment_disabled: z.boolean().optional().describe('禁用评论'),
  duet_disabled: z.boolean().optional().describe('禁用合拍'),
  stitch_disabled: z.boolean().optional().describe('禁用拼接'),
  brand_organic_toggle: z.boolean().optional().describe('品牌自然流量开关'),
  brand_content_toggle: z.boolean().optional().describe('品牌内容开关'),
})

export const FacebookOptionsSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().describe('内容类型'),
})

export const InstagramOptionsSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().describe('内容类型'),
})

export const ThreadsOptionsSchema = z.object({
  location_id: z.string().nullable().optional().describe('位置 ID'),
})

export const PlatformOptionsSchema = z.object({
  bilibili: BilibiliOptionsSchema.optional(),
  youtube: YoutubeOptionsSchema.optional(),
  tiktok: TiktokOptionsSchema.optional(),
  facebook: FacebookOptionsSchema.optional(),
  instagram: InstagramOptionsSchema.optional(),
  threads: ThreadsOptionsSchema.optional(),
}).describe('各平台发布配置')

export type PlatformOptions = z.infer<typeof PlatformOptionsSchema>
