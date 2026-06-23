import { z } from 'zod'
import {
  InstagramMediaContainerStatusCode,
  InstagramWebhookChangeField,
  InstagramWebhookMediaStatus,
  InstagramWebhookObject,
} from './instagram.interface'

export enum InstagramMediaType {
  Image = 'IMAGE',
  Reels = 'REELS',
  Stories = 'STORIES',
  Carousel = 'CAROUSEL',
}

export const InstagramOptionSchema = z.object({
  alt_text: z.string().max(1000).optional().describe('替代文本'),
  caption: z.string().max(2200).optional().describe('标题'),
  collaborators: z.array(z.string()).max(3).optional().describe('协作者'),
  cover_url: z.string().optional().describe('封面 URL'),
  image_url: z.string().optional().describe('图片 URL'),
  location_id: z.string().optional().describe('位置 ID'),
  media_type: z.enum(InstagramMediaType).optional().describe('媒体类型'),
  product_tags: z.array(z.object({
    product_id: z.string().describe('商品 ID'),
    x: z.number().describe('标签横向位置'),
    y: z.number().describe('标签纵向位置'),
  })).optional().describe('商品标签'),
  user_tags: z.array(z.object({
    username: z.string().describe('用户名称'),
    x: z.number().describe('标签横向位置'),
    y: z.number().describe('标签纵向位置'),
  })).optional().describe('用户标签'),
})

export type InstagramOption = z.infer<typeof InstagramOptionSchema>

export const InstagramWebhookDataOptionSchema = z.object({
  field: z.enum(InstagramWebhookChangeField).describe('Instagram webhook change field'),
  id: z.string().min(1).optional().describe('Instagram webhook value id'),
  mediaId: z.string().min(1).optional().describe('Instagram final media id'),
  status: z.enum(InstagramWebhookMediaStatus).optional().describe('Instagram media webhook status'),
  permalink: z.string().min(1).optional().describe('Instagram media permalink'),
})

export const InstagramPublishDataOptionSchema = z.object({
  containerId: z.string().min(1).optional().describe('Instagram creation/container id before media_publish'),
  childContainerIds: z.array(z.string().min(1)).optional().describe('Instagram carousel child container ids'),
  mediaType: z.enum(InstagramMediaType).optional().describe('Instagram media type used for the publish request'),
  webhook: InstagramWebhookDataOptionSchema.optional().describe('Normalized Instagram webhook payload for publish completion'),
})

export type InstagramPublishDataOption = z.infer<typeof InstagramPublishDataOptionSchema>

export const InstagramMediaContainerStatusResponseSchema = z.object({
  status_code: z.enum(InstagramMediaContainerStatusCode).optional().describe('Instagram media container status code'),
  status: z.string().optional().describe('Instagram media container status text'),
})

export const InstagramWebhookMediaChangeValueSchema = z.object({
  id: z.string().min(1).optional().describe('Instagram webhook value id'),
  media_id: z.string().min(1).optional().describe('Instagram media id'),
  comment_id: z.string().min(1).optional().describe('Instagram comment id when media event is tied to a comment'),
  status: z.enum(InstagramWebhookMediaStatus).optional().describe('Instagram media webhook status'),
  permalink: z.string().min(1).optional().describe('Instagram media permalink'),
})

export const InstagramWebhookCommentChangeValueSchema = z.object({
  id: z.string().min(1).optional().describe('Instagram comment id'),
  comment_id: z.string().min(1).optional().describe('Instagram comment id'),
  text: z.string().optional().describe('Instagram comment text'),
  parent_id: z.string().min(1).optional().describe('Parent comment id for replies'),
  media: z.object({
    id: z.string().min(1).optional().describe('Instagram media id'),
    media_product_type: z.string().min(1).optional().describe('Instagram media product type'),
  }).optional().describe('Instagram media attached to the comment'),
  from: z.object({
    id: z.string().min(1).optional().describe('Instagram scoped commenter id'),
    username: z.string().min(1).optional().describe('Instagram commenter username'),
  }).optional().describe('Instagram commenter profile'),
})

export const InstagramWebhookMentionChangeValueSchema = z.object({
  id: z.string().min(1).optional().describe('Instagram webhook value id'),
  media_id: z.string().min(1).optional().describe('Instagram media id'),
  comment_id: z.string().min(1).optional().describe('Instagram comment id'),
  permalink: z.string().min(1).optional().describe('Instagram media permalink'),
})

export const InstagramWebhookChangeSchema = z.union([
  z.object({
    field: z.literal(InstagramWebhookChangeField.Media).describe('Instagram webhook media field'),
    value: InstagramWebhookMediaChangeValueSchema.describe('Instagram media webhook value'),
  }),
  z.object({
    field: z.literal(InstagramWebhookChangeField.Comments).describe('Instagram webhook comments field'),
    value: InstagramWebhookCommentChangeValueSchema.describe('Instagram comment webhook value'),
  }),
  z.object({
    field: z.literal(InstagramWebhookChangeField.Mentions).describe('Instagram webhook mentions field'),
    value: InstagramWebhookMentionChangeValueSchema.describe('Instagram mention webhook value'),
  }),
])

export const InstagramWebhookBodySchema = z.object({
  object: z.enum(InstagramWebhookObject).optional().describe('Instagram webhook object'),
  entry: z.array(z.object({
    id: z.string().min(1).optional().describe('Instagram webhook entry id'),
    time: z.number().int().optional().describe('Instagram webhook entry time'),
    changes: z.array(InstagramWebhookChangeSchema).optional().describe('Instagram webhook changes'),
  })).optional().describe('Instagram webhook entries'),
})
