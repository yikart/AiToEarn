import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const BiliBiliPublishTaskMetaSchema = z.object({
  tid: z.number().int().positive().default(160),
  no_reprint: z.number().int().default(0),
  copyright: z.number().int().default(1),
  source: z.string().optional(),
}).optional()

export const WxGzhPublishTaskMetaSchema = z.object({
  open_comment: z.number().int().optional(),
  only_fans_can_comment: z.number().int().optional(),
}).optional()

export const YoutubePublishTaskMetaSchema = z.object({
  privacyStatus: z.enum(['public', 'unlisted', 'private']),
  license: z.enum(['youtube', 'creativeCommon']),
  categoryId: z.string(),
}).optional()

export const PinterestPublishTaskMetaSchema = z.object({
  boardId: z.string(),
}).optional()

export const ThreadsPublishTaskMetaSchema = z.object({
  location_id: z.string(),
}).optional()

export const TiktokPublishTaskMetaSchema = z.object({
  privacy_level: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']),
  comment_disabled: z.boolean().optional(),
  duet_disabled: z.boolean().optional(),
  stitch_disabled: z.boolean().optional(),
  brand_organic_toggle: z.boolean().optional(),
  brand_content_toggle: z.boolean().optional(),
}).optional()

export const MetaCommonSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().default('post'),
}).optional()

export const CreatePublishingTaskSchema = z.object({
  accounts: z.array(z.string()).describe('账户ID数组').optional(),
  title: z.string().nullish().describe('标题'),
  desc: z.string().nullish().describe('内容'),
  videoUrl: z.string().nullish().describe('视频链接'),
  coverUrl: z.string().nullish().describe('封面链接'),
  imgUrlList: z.array(z.string()).nullish().describe('图片链接数组，逗号分隔'),
  publishingTime: z.string().nullish().describe('发布时间，格式：YYYY-MM-DD HH:mm:ss'),
  topics: z.array(z.string()).optional().describe('话题数组').transform(val => val || []),
  option: z.object({
    bilibili: BiliBiliPublishTaskMetaSchema,
    wxGzh: WxGzhPublishTaskMetaSchema,
    youtube: YoutubePublishTaskMetaSchema,
    pinterest: PinterestPublishTaskMetaSchema,
    threads: ThreadsPublishTaskMetaSchema,
    tiktok: TiktokPublishTaskMetaSchema,
    facebook: MetaCommonSchema,
    instagram: MetaCommonSchema,
  }).optional(),
})

export const CreatePublishingTasksSchema = z.object({
  accountId: z.string().describe('账户ID'),
  title: z.string().nullable().optional().transform(val => !val ? undefined : val),
  desc: z.string().nullable().optional().transform(val => !val ? undefined : val),
  videoUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  coverUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  imgUrlList: z.array(z.string()).nullable().optional().transform(val => !val ? undefined : val),
  publishTime: z.string().nullable().optional().transform(val => !val ? undefined : val),
  topics: z.array(z.string()).optional().describe('话题数组').transform(val => val || []),
  option: z.object({
    bilibili: BiliBiliPublishTaskMetaSchema,
    wxGzh: WxGzhPublishTaskMetaSchema,
    youtube: YoutubePublishTaskMetaSchema,
    pinterest: PinterestPublishTaskMetaSchema,
    threads: ThreadsPublishTaskMetaSchema,
    tiktok: TiktokPublishTaskMetaSchema,
    facebook: MetaCommonSchema,
    instagram: MetaCommonSchema,
  }).optional(),
})

export class CreatePublishingTaskDto extends createZodDto(CreatePublishingTaskSchema) {}
export class CreatePublishingTasksDto extends createZodDto(CreatePublishingTasksSchema) {}
