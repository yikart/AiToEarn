import { AccountType, createZodDto } from '@yikart/common'
import { PublishRecordLinkStatus, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishingChannel } from './channel.interfaces'
import { TwitterPublishOptionSchema } from './platforms/twitter/twitter-post-options.schema'

const BilibiliOptionSchema = z.object({
  tid: z.number().describe('分区 ID'),
  copyright: z.union([z.literal(1), z.literal(2)]).describe('1-原创，2-转载'),
  no_reprint: z.union([z.literal(0), z.literal(1)]).optional().describe('是否允许转载 0-允许，1-不允许'),
  source: z.string().optional().describe('转载来源'),
  topic_id: z.number().optional().describe('话题 ID'),
})

const YoutubeOptionSchema = z.object({
  privacyStatus: z.string().optional().describe('隐私状态'),
  tag: z.string().optional().describe('标签'),
  categoryId: z.string().optional().describe('分类 ID'),
  publishAt: z.string().optional().describe('定时发布时间'),
  license: z.string().optional().describe('许可证'),
  embeddable: z.boolean().optional().describe('是否可嵌入'),
  notifySubscribers: z.boolean().optional().describe('是否通知订阅者'),
  selfDeclaredMadeForKids: z.boolean().optional().describe('是否自认为适合儿童'),
})

const WxGzhOptionSchema = z.object({
  tid: z.number().describe('分区 ID'),
})

const FacebookOptionSchema = z.object({
  content_category: z.string().describe('内容分类'),
  content_tags: z.array(z.string()).optional().describe('内容标签'),
  custom_labels: z.array(z.string()).optional().describe('自定义标签'),
  direct_share_status: z.number().optional().describe('直接分享状态'),
  embeddable: z.boolean().optional().describe('是否可嵌入'),
})

const InstagramOptionSchema = z.object({
  content_category: z.string().describe('内容分类'),
  alt_text: z.string().optional().describe('替代文本'),
  caption: z.string().optional().describe('标题'),
  collaborators: z.array(z.string()).optional().describe('协作者'),
  cover_url: z.string().optional().describe('封面 URL'),
  image_url: z.string().optional().describe('图片 URL'),
  location_id: z.string().optional().describe('位置 ID'),
  product_tags: z.array(z.object({
    product_id: z.string(),
    x: z.number(),
    y: z.number(),
  })).optional().describe('商品标签'),
  user_tags: z.array(z.object({
    username: z.string(),
    x: z.number(),
    y: z.number(),
  })).optional().describe('用户标签'),
})

const ThreadsOptionSchema = z.object({
  reply_control: z.string().optional().describe('回复控制'),
  location_id: z.string().optional().describe('位置 ID'),
  allowlisted_country_codes: z.array(z.string()).optional().describe('允许的国家代码'),
  alt_text: z.string().optional().describe('替代文本'),
  auto_publish_text: z.boolean().optional().describe('是否自动发布文本'),
  topic_tags: z.string().optional().describe('话题标签'),
})

const PinterestOptionSchema = z.object({
  boardId: z.string().optional().describe('画板 ID'),
})

const TiktokOptionSchema = z.object({
  privacy_level: z.enum([
    'PUBLIC_TO_EVERYONE',
    'MUTUAL_FOLLOW_FRIENDS',
    'SELF_ONLY',
    'FOLLOWER_OF_CREATOR',
  ]).describe('隐私级别'),
  disable_duet: z.boolean().optional().describe('是否禁用合拍'),
  disable_stitch: z.boolean().optional().describe('是否禁用拼接'),
  disable_comment: z.boolean().optional().describe('是否禁用评论'),
  brand_organic_toggle: z.boolean().optional().describe('品牌有机内容'),
  brand_content_toggle: z.boolean().optional().describe('品牌内容'),
})

const DouyinOptionSchema = z.object({
  shareId: z.string().optional().describe('分享 ID'),
  hashtag_list: z.array(z.string()).optional().describe('话题标签列表'),
  title: z.string().optional().describe('标题'),
  short_title: z.string().optional().describe('短标题'),
  title_hashtag_list: z.array(z.object({
    name: z.string(),
    start: z.number(),
  })).optional().describe('标题话题标签列表'),
  downloadType: z.union([z.literal(1), z.literal(2)]).optional().describe('下载类型 1-允许，2-不允许'),
  privateStatus: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional().describe('私密状态'),
  image_list_path: z.array(z.string()).optional().describe('图片路径列表'),
  video_path: z.string().optional().describe('视频路径'),
})

export const PlatOptionsSchema = z.object({
  bilibili: BilibiliOptionSchema.optional().describe('Bilibili 发布选项'),
  youtube: YoutubeOptionSchema.optional().describe('YouTube 发布选项'),
  wxGzh: WxGzhOptionSchema.optional().describe('微信公众号发布选项'),
  facebook: FacebookOptionSchema.optional().describe('Facebook 发布选项'),
  instagram: InstagramOptionSchema.optional().describe('Instagram 发布选项'),
  threads: ThreadsOptionSchema.optional().describe('Threads 发布选项'),
  pinterest: PinterestOptionSchema.optional().describe('Pinterest 发布选项'),
  tiktok: TiktokOptionSchema.optional().describe('TikTok 发布选项'),
  douyin: DouyinOptionSchema.optional().describe('抖音发布选项'),
  twitter: TwitterPublishOptionSchema.optional().describe('Twitter 发布选项'),
})

export const CreatePublishSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional(),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.enum(AccountType, { message: '平台类型' }),
  type: z.enum(PublishType, { message: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  materialGroupId: z.string({ message: '草稿箱ID' }).optional(), // 草稿箱ID
  materialId: z.string({ message: '草稿ID' }).optional(), // 草稿ID
  source: z.nativeEnum(PublishRecordSource).optional().describe('发布来源'),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.coerce.date(),
  topics: z.array(z.string()),
  option: PlatOptionsSchema.optional(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}

export const PubRecordListFilterSchema = z.object({
  accountId: z.string().optional().describe('账户ID'),
  uid: z.string().optional().describe('第三方平台账户id'),
  flowId: z.string().optional().describe('流水ID'),
  accountType: z.enum(AccountType).optional().describe('账户类型'),
  type: z.enum(PublishType).optional().describe('类型'),
  status: z.enum(PublishStatus).optional().describe('状态'),
  time: z
    .tuple([z.coerce.date(), z.coerce.date()])
    .optional()
    .describe('创建时间区间，必须为UTC时间'),
  publishingChannel: z.enum(PublishingChannel).optional().describe('发布渠道，通过我们内部系统发布的(internal)或平台原生端(native)'),
})
export class PubRecordListFilterDto extends createZodDto(PubRecordListFilterSchema) {}

export const UpdatePublishRecordTimeSchema = z.object({
  id: z.string().describe('数据ID'),
  publishTime: z.coerce.date()
    .describe('新的发布时间，日期为UTC时间'),
})
export class UpdatePublishRecordTimeDto extends createZodDto(UpdatePublishRecordTimeSchema) {}

export const UpdatePublishRecordWorkLinkSchema = z.object({
  id: z.string().describe('发布记录ID'),
  workLink: z.string().min(1).optional().describe('作品链接'),
  dataId: z.string().min(1).optional().describe('作品数据ID'),
  platformWorkId: z.string().min(1).optional().describe('平台作品ID'),
  linkStatus: z.enum(PublishRecordLinkStatus).default(PublishRecordLinkStatus.READY).describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
})
export class UpdatePublishRecordWorkLinkDto extends createZodDto(UpdatePublishRecordWorkLinkSchema) {}

export const createPublishRecordSchema = z.object({
  flowId: z.string().optional(),
  dataId: z.string(),
  type: z.enum(PublishType),
  status: z.enum(PublishStatus, { message: '状态' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  materialGroupId: z.string().optional().describe('草稿箱ID'),
  materialId: z.string().optional().describe('草稿ID'),
  accountId: z.string(),
  topics: z.array(z.string()),
  accountType: z.enum(AccountType),
  uid: z.string(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.coerce.date(),
  imgList: z.array(z.string()).optional(),
  workLink: z.string().optional(),
  platformWorkId: z.string().optional().describe('平台作品ID'),
  linkStatus: z.enum(PublishRecordLinkStatus).optional().describe('作品链接状态'),
  linkError: z.string().optional().describe('作品链接获取错误'),
  linkMeta: z.record(z.string(), z.any()).optional().describe('作品链接扩展信息'),
  errorMsg: z.string().optional(),
  source: z.enum(PublishRecordSource).optional(),
  option: PlatOptionsSchema.optional(),
})
export class CreatePublishRecordDto extends createZodDto(createPublishRecordSchema) { }

export const PublishDayInfoListFiltersSchema = z.object({
  time: z.tuple([
    z.coerce.date(),
    z.coerce.date(),
  ]).optional(),
})
export class PublishDayInfoListFiltersDto extends createZodDto(PublishDayInfoListFiltersSchema) { }

export const listPostHistorySchema = z.object({
  uid: z.string(),
  accountType: z.enum(AccountType),
})
export class ListPostHistoryDto extends createZodDto(listPostHistorySchema) {}

export enum YouTubePrivacyStatus {
  Public = 'public',
  Unlisted = 'unlisted',
  Private = 'private',
}

export enum YouTubeLicense {
  CreativeCommon = 'creativeCommon',
  YouTube = 'youtube',
}

export const YouTubePublishOptionSchema = z.object({
  privacyStatus: z.enum([
    YouTubePrivacyStatus.Public,
    YouTubePrivacyStatus.Unlisted,
    YouTubePrivacyStatus.Private,
  ]),
  license: z.enum(YouTubeLicense).optional(),
  categoryId: z.string(),
  notifySubscribers: z.boolean().optional().default(false),
  embeddable: z.boolean().optional().default(false),
  selfDeclaredMadeForKids: z.boolean().optional().default(false),
})

export const UpdatePublishTaskSchema = z.object({
  id: z.string({ message: '任务ID' }),
  desc: z.string().optional(),
  videoUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  option: z.object({
    youtube: YouTubePublishOptionSchema.optional(),
  }).optional(),
})
export class UpdatePublishTaskDto extends createZodDto(UpdatePublishTaskSchema) {}
