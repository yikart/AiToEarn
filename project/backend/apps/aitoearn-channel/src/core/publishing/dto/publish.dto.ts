import { AccountType } from '@yikart/aitoearn-server-client'
import { createZodDto } from '@yikart/common'
import { ObjectId } from 'mongodb'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import {
  PublishStatus,
  PublishType,
} from '../../../libs/database/schema/publishTask.schema'

export const PublishRecordIdSchema = z.object({
  id: z.string().describe('ID'),
})
export class PublishRecordIdDto extends createZodDto(PublishRecordIdSchema) {}

export const UpPublishTaskTimeSchema = z.object({
  id: z.string({ message: '任务ID' }),
  publishTime: z
    .date({ message: '发布日期不能为空' })
    .default(() => new Date()),
  userId: z.string({ message: 'userId不能为空' }),
})
export type UpPublishTaskTimeDto = z.infer<typeof UpPublishTaskTimeSchema>

export const DeletePublishTaskSchema = z.object({
  id: z.string({ message: '任务ID' }),
  userId: z.string({ message: 'userId不能为空' }),
})
export class DeletePublishTaskDto extends createZodDto(
  DeletePublishTaskSchema,
) {}

export enum BilibiliNoReprint {
  No = 1,
  Yes = 0,
}
export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

export const BiliBiliPublishOptionSchema = z.object({
  tid: z.number().int().positive(),
  no_reprint: z.enum(BilibiliNoReprint).optional(),
  copyright: z.enum(Copyright),
  source: z.string().optional(),
})

export const WxGzhPublishOptionSchema = z.object({
  open_comment: z.number().int().optional(),
  only_fans_can_comment: z.number().int().optional(),
})

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
  ]).optional().default(YouTubePrivacyStatus.Public),
  license: z.enum(YouTubeLicense).optional(),
  categoryId: z.string(),
  notifySubscribers: z.boolean().optional().default(false),
  embeddable: z.boolean().optional().default(false),
  selfDeclaredMadeForKids: z.boolean().optional().default(false),
})

export const FacebookPublishOptionSchema = z.object({
  page_id: z.string().optional(),
  content_category: z.string().optional(),
  content_tags: z.array(z.string()).optional(),
  custom_labels: z.array(z.string()).optional(),
  direct_share_status: z.number().int().optional(),
  embeddable: z.boolean().optional(),
})

export const InstagramPublishOptionSchema = z.object({
  content_category: z.string().optional(),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  collaborators: z.array(z.string()).optional(),
  cover_url: z.string().optional(),
  image_url: z.string().optional(),
  location_id: z.string().optional(),
  product_tags: z.array(z.object({
    product_id: z.string(),
    x: z.number(),
    y: z.number(),
  })).optional(),
  user_tags: z.array(z.object({
    username: z.string(),
    x: z.number(),
    y: z.number(),
  })).optional(),
})

export const threadsPublishOptionSchema = z.object({
  reply_control: z.string().optional(),
  allowlisted_country_codes: z.array(z.string()).optional(),
  alt_text: z.string().optional(),
  auto_publish_text: z.boolean().optional(),
  topic_tags: z.string().optional(),
  location_id: z.string().optional(),
})

export const pinterestPublishOptionSchema = z.object({
  boardId: z.string().optional(),
})

export const TiktokPublishOptionSchema = z.object({
  privacy_level: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']),
  disable_duet: z.boolean().optional(),
  disable_stitch: z.boolean().optional(),
  disable_comment: z.boolean().optional(),
  brand_organic_toggle: z.boolean().optional(),
  brand_content_toggle: z.boolean().optional(),
})

export const CreatePublishSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional().default(uuid()),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.enum(AccountType, { message: '平台类型' }),
  type: z.enum(PublishType, { message: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  userTaskId: z.string({ message: '用户任务ID' }).optional(), // 用户任务ID
  taskMaterialId: z.string({ message: '任务素材ID' }).optional(), // 任务素材ID
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.coerce.date(),
  topics: z.array(z.string()),
  option: z.object({
    bilibili: BiliBiliPublishOptionSchema.optional(),
    wxGzh: WxGzhPublishOptionSchema.optional(),
    youtube: YouTubePublishOptionSchema.optional(),
    facebook: FacebookPublishOptionSchema.optional(),
    instagram: InstagramPublishOptionSchema.optional(),
    threads: threadsPublishOptionSchema.optional(),
    pinterest: pinterestPublishOptionSchema.optional(),
    tiktok: TiktokPublishOptionSchema.optional(),
  }).optional(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}

export const UpdatePublishTaskSchema = z.object({
  id: z.string({ message: '任务ID' }),
  userId: z.string({ message: '用户ID' }),
  desc: z.string().optional(),
  videoUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  option: z.object({
    youtube: YouTubePublishOptionSchema.optional(),
  }).optional(),
})
export class UpdatePublishTaskDto extends createZodDto(UpdatePublishTaskSchema) {}

/**
 * 创建发布记录
 */
export const CreatePublishRecordSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional(),
  dataId: z.string({ message: '数据ID' }),
  userId: z.string({ message: '用户ID' }),
  uid: z.string({ message: '频道账户ID' }),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.enum(AccountType, { message: '平台类型' }),
  type: z.enum(PublishType, { message: '类型' }),
  status: z.enum(PublishStatus, { message: '状态' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  userTaskId: z.string({ message: '用户任务ID' }).optional(), // 用户任务ID
  taskId: z.string({ message: '任务ID' }).optional(), // 任务ID
  taskMaterialId: z.string({ message: '任务素材ID' }).optional(), // 任务素材ID
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgList: z.array(z.string()).optional(),
  publishTime: z.coerce.date(),
  topics: z.array(z.string()),
  option: z.object({
    bilibili: BiliBiliPublishOptionSchema.optional(),
    // wxGzh: WxGzhPublishOptionSchema.optional(),
    youtube: YouTubePublishOptionSchema.optional(),
    facebook: FacebookPublishOptionSchema.optional(),
    instagram: InstagramPublishOptionSchema.optional(),
    threads: threadsPublishOptionSchema.optional(),
    pinterest: pinterestPublishOptionSchema.optional(),
  }).optional(),
})
export class CreatePublishRecordDto extends createZodDto(CreatePublishRecordSchema) {}

export const PublishRecordListFilterSchema = z.object({
  userId: z.string().describe('用户ID'),
  accountId: z.string().optional().describe('账户ID'),
  uid: z.string().optional().describe('第三方平台用户id'),
  accountType: z.enum(AccountType).optional().describe('账户类型'),
  type: z.enum(PublishType).optional().describe('类型'),
  status: z.enum(PublishStatus).optional().describe('状态'),
  time: z.tuple([
    z.coerce.date(),
    z.coerce.date(),
  ])
    .optional()
    .describe('创建时间区间'),
})
export class PublishRecordListFilterDto extends createZodDto(
  PublishRecordListFilterSchema,
) {}

// 立即发布 dto
export const NowPubTaskSchema = z.object({
  id: z.string({ message: '任务ID' }),
})
export class NowPubTaskDto extends createZodDto(NowPubTaskSchema) {}

export const PublishDayInfoListFiltersSchema = z.object({
  userId: z.string().optional(),
  time: z.tuple([
    z.coerce.date(),
    z.coerce.date(),
  ])
    .optional(),
})
export class PublishDayInfoListFiltersDto extends createZodDto(PublishDayInfoListFiltersSchema) {}

export const PublishDayInfoListSchema = z.object({
  filters: PublishDayInfoListFiltersSchema,
  page: z.object({
    pageNo: z.number().min(1, { message: '页码不能小于1' }),
    pageSize: z.number().min(1, { message: '页大小不能小于1' }),
  }),
})
export class PublishDayInfoListDto extends createZodDto(PublishDayInfoListSchema) {}

export const GetPublishRecordDetailSchema = z.object({
  id: z.string({ message: 'ID is required' }).refine(val => ObjectId.isValid(val), { message: 'Invalid Publish Record ID' }),
  userId: z.string({ message: 'userId is required' }),
})

export class GetPublishRecordDetailDto extends createZodDto(GetPublishRecordDetailSchema) {}
