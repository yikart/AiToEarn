import { z } from 'zod'

export const GetPublishingTaskStatusSchema = z.object({
  flowId: z.string().describe('flow Id from publish task creation'),
})
export type GetPublishingTaskStatus = z.infer<typeof GetPublishingTaskStatusSchema>

export const GetYoutubeContentCategoriesSchema = z.object({
  regionCode: z.string().describe('region code').default('US'),
})
export type GetYoutubeContentCategories = z.infer<typeof GetYoutubeContentCategoriesSchema>

// Core schema without .optional() for extending
const BiliBiliPublishTaskMetaCoreSchema = z.object({
  tid: z.number().int().positive().default(160).describe('category id'),
  no_reprint: z.number().int().default(0).describe('disable reprint'),
  copyright: z.number().int().default(1).describe('original or forward'),
  source: z.string().optional().describe('source link'),
})

// With .optional() for backward compatibility
export const BiliBiliPublishTaskMetaSchema = BiliBiliPublishTaskMetaCoreSchema.optional()
export type BiliBiliPublishTaskMeta = z.infer<typeof BiliBiliPublishTaskMetaCoreSchema>

export const WxGzhPublishTaskMetaSchema = z.object({
  open_comment: z.number().int().optional(),
  only_fans_can_comment: z.number().int().optional(),
}).optional()

// Core schema without .optional() for extending
const YoutubePublishTaskMetaCoreSchema = z.object({
  privacyStatus: z.enum(['public', 'unlisted', 'private']).describe('privacy status'),
  license: z.enum(['youtube', 'creativeCommon']).describe('license'),
  categoryId: z.string().describe('category id'),
})

// With .optional() for backward compatibility
export const YoutubePublishTaskMetaSchema = YoutubePublishTaskMetaCoreSchema.optional()
export type YoutubePublishTaskMeta = z.infer<typeof YoutubePublishTaskMetaCoreSchema>

export const PinterestPublishTaskMetaSchema = z.object({
  boardId: z.string().describe('board id'),
}).optional()

export const ThreadsPublishTaskMetaSchema = z.object({
  location_id: z.string().describe('location id'),
}).optional()

export const MetaCommonSchema = z.object({
  content_category: z.enum(['post', 'reel', 'story']).optional().default('post').describe('content category'),
}).optional()

export const TiktokPublishTaskMetaSchema = z.object({
  privacy_level: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']).describe('privacy level'),
  comment_disabled: z.boolean().optional().describe('comment disabled'),
  duet_disabled: z.boolean().optional().describe('duet disabled'),
  stitch_disabled: z.boolean().optional().describe('stitch disabled'),
  brand_organic_toggle: z.boolean().optional().describe('brand organic toggle'),
  brand_content_toggle: z.boolean().optional().describe('brand content toggle'),
}).optional()

export const PublishTaskOptionSchema = z.object({
  bilibili: BiliBiliPublishTaskMetaSchema,
  wxGzh: WxGzhPublishTaskMetaSchema,
  youtube: YoutubePublishTaskMetaSchema,
  pinterest: PinterestPublishTaskMetaSchema,
  threads: ThreadsPublishTaskMetaSchema,
  tiktok: TiktokPublishTaskMetaSchema,
  facebook: MetaCommonSchema,
  instagram: MetaCommonSchema,
})
export type PublishTaskOption = z.infer<typeof PublishTaskOptionSchema>

// Base fields for reuse
const basePublishingFields = {
  accountId: z.string().describe('account id'),
  userTaskId: z.string().optional().describe('user task id'),
  publishTime: z.string().datetime().optional().describe('publish time'),
}

// Default schema for platforms without specific options
export const CreatePublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().optional().describe('title'),
  desc: z.string().optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).optional().describe('image url list'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreatePublishingTask = z.infer<typeof CreatePublishingTaskSchema>

// Platform-specific schemas with option field
export const CreateBiliBiliPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().describe('title'),
  desc: z.string().optional().describe('description'),
  videoUrl: z.string().describe('video url'),
  coverUrl: z.string().describe('cover url'),
  topics: z.array(z.string()).min(1, { message: 'At least one topic (hashtag) is required.' }).max(10, { message: 'Topics count cannot exceed 10.' }).describe('topics (hashtags); 1-10 required'),
  option: BiliBiliPublishTaskMetaCoreSchema.optional(),
})
export type CreateBiliBiliPublishingTask = z.infer<typeof CreateBiliBiliPublishingTaskSchema>

export const CreateFacebookPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().describe('title'),
  desc: z.string().max(5000, { message: 'Description length cannot exceed 5000 characters.' }).describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(10).optional().describe('image url list; 1-10 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreateFacebookPublishingTask = z.infer<typeof CreateFacebookPublishingTaskSchema>

export const CreateInstagramPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(2200, { message: 'Title length cannot exceed 2200 characters.' }).describe('title'),
  desc: z.string().max(5000, { message: 'Description length cannot exceed 5000 characters.' }).describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(10).optional().describe('image url list; 1-10 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreateInstagramPublishingTask = z.infer<typeof CreateInstagramPublishingTaskSchema>

export const CreateThreadsPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(500, { message: 'Title length cannot exceed 500 characters.' }).describe('title'),
  desc: z.string().max(500, { message: 'Description length cannot exceed 500 characters.' }).describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(10).optional().describe('image url list; 1-10 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreateThreadsPublishingTask = z.infer<typeof CreateThreadsPublishingTaskSchema>

export const CreatePinterestPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().describe('title'),
  desc: z.string().optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(1).optional().describe('image url list; 1 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreatePinterestPublishingTask = z.infer<typeof CreatePinterestPublishingTaskSchema>

export const CreateYoutubePublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(100, { message: 'Title length cannot exceed 100 characters.' }).describe('title'),
  desc: z.string().max(5000, { message: 'Description length cannot exceed 5000 characters.' }).describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
  option: YoutubePublishTaskMetaCoreSchema.optional(),
})
export type CreateYoutubePublishingTask = z.infer<typeof CreateYoutubePublishingTaskSchema>

export const CreateTiktokPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(200, { message: 'Title length cannot exceed 200 characters.' }).optional().describe('title'),
  desc: z.string().max(2200, { message: 'Description length cannot exceed 2200 characters.' }).optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(10).optional().describe('image url list; 1-10 allowed'),
  topics: z.array(z.string()).max(5).optional().default([]).describe('topics; max 5'),
})
export type CreateTiktokPublishingTask = z.infer<typeof CreateTiktokPublishingTaskSchema>

export const CreateTwitterPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(280, { message: 'Title length cannot exceed 280 characters.' }).optional().describe('title'),
  desc: z.string().max(280, { message: 'Description length cannot exceed 280 characters.' }).optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(4).optional().describe('image url list; 1-4 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreateTwitterPublishingTask = z.infer<typeof CreateTwitterPublishingTaskSchema>

export const CreateKwaiPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().optional().describe('title'),
  desc: z.string().optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  topics: z.array(z.string()).max(4).optional().default([]).describe('topics; max 4'),
})
export type CreateKwaiPublishingTask = z.infer<typeof CreateKwaiPublishingTaskSchema>

export const CreateXhsPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(200, { message: 'Title length cannot exceed 200 characters.' }).optional().describe('title'),
  desc: z.string().max(1000, { message: 'Description length cannot exceed 1000 characters.' }).optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(9).optional().describe('image url list; 1-9 allowed'),
  topics: z.array(z.string()).optional().default([]).describe('topics'),
})
export type CreateXhsPublishingTask = z.infer<typeof CreateXhsPublishingTaskSchema>

export const CreateDouyinPublishingTaskSchema = z.object({
  ...basePublishingFields,
  title: z.string().max(800, { message: 'Title length cannot exceed 800 characters.' }).optional().describe('title'),
  desc: z.string().max(800, { message: 'Description length cannot exceed 800 characters.' }).optional().describe('description'),
  videoUrl: z.string().optional().describe('video url'),
  coverUrl: z.string().optional().describe('cover url'),
  imgUrlList: z.array(z.string()).min(1).max(9).optional().describe('image url list; 1-9 allowed'),
  topics: z.array(z.string()).max(5).optional().default([]).describe('topics'),
})
export type CreateDouyinPublishingTask = z.infer<typeof CreateDouyinPublishingTaskSchema>
