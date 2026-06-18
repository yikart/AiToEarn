import type { PlatformGraphQueryInput } from '../platforms.utils'
import { z } from 'zod'
import {
  FacebookContentCategory,
  FacebookVideoStatus,
  FacebookWebhookFeedItem,
  FacebookWebhookField,
  FacebookWebhookObject,
  FacebookWebhookStatus,
  FacebookWebhookVerb,
} from './facebook.enum'

export interface GraphApiResponse<T> {
  data: T
  paging?: {
    cursors?: { before: string, after: string }
    next?: string
    previous?: string
  }
}

export type FacebookGraphQueryInput = PlatformGraphQueryInput

export interface FacebookInsightValueBreakdown {
  like?: number
  love?: number
  wow?: number
  haha?: number
  sorry?: number
  anger?: number
  link_clicks?: number
  other_clicks?: number
  photo_view?: number
  video_play?: number
}

export interface FacebookInsightValue {
  value?: number | string | FacebookInsightValueBreakdown
  end_time?: string
}

export interface FacebookInsight {
  name: string
  period?: string
  values?: FacebookInsightValue[]
  title?: string
  description?: string
  id?: string
}

export interface FacebookCommentAuthor {
  id?: string
  name?: string
}

export interface FacebookComment {
  id: string
  message?: string
  from?: FacebookCommentAuthor
  created_time?: string
  like_count?: number
  comment_count?: number
  parent?: { id?: string }
}

export interface FacebookPage {
  id: string
  name: string
  access_token: string
  fan_count?: number
  followers_count?: number
  picture?: { data?: { url?: string } }
  tasks?: string[]
  category?: string
  category_list?: Array<{ id: string, name: string }>
}

export interface FacebookPost {
  id: string
  post_id?: string
  message?: string
  permalink_url?: string
  created_time?: string
  full_picture?: string
  type?: string
  status_type?: string
  attachments?: {
    data?: FacebookPostAttachment[]
  }
}

export interface FacebookPostAttachment {
  media_type?: string
  type?: string
  media?: {
    image?: {
      height?: number
      src?: string
      width?: number
    }
    source?: string
  }
  subattachments?: {
    data?: FacebookPostAttachment[]
  }
}

export interface FacebookCommentCreateResponse {
  id: string
}

export interface FacebookVideo {
  id: string
  post_id?: string
  permalink_url?: string
  status?: { video_status: FacebookVideoStatus }
}

export interface FacebookVideoStatusResult {
  id: string
  status?: FacebookVideoStatus
}

export interface FacebookPagePostPublishResult {
  id: string
  post_id?: string
}

export interface FacebookVideoPublishResult {
  id: string
}

export interface FacebookReelPublishResult {
  videoId: string
}

export interface FacebookPhotoStoryPublishResult {
  postId: string
  photoId: string
}

export interface FacebookVideoStoryPublishResult {
  postId: string
  videoId: string
}

export interface FacebookPhotoFeedBody {
  attached_media: Array<{ media_fbid: string }>
  message?: string
}

const FacebookWebhookFeedValueSchema = z.object({
  item: z.enum(FacebookWebhookFeedItem).optional(),
  verb: z.enum(FacebookWebhookVerb).optional(),
  post_id: z.string().optional(),
  story_id: z.string().optional(),
  video_id: z.string().optional(),
  photo_id: z.string().optional(),
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  sender_id: z.string().optional(),
  created_time: z.number().optional(),
  message: z.string().optional(),
  link: z.string().optional(),
  permalink_url: z.string().optional(),
  status: z.enum(FacebookWebhookStatus).optional(),
  video_status: z.enum(FacebookVideoStatus).optional(),
  reaction_type: z.string().optional(),
})

const FacebookWebhookCommentsValueSchema = z.object({
  item: z.enum(FacebookWebhookFeedItem).optional(),
  verb: z.enum(FacebookWebhookVerb).optional(),
  post_id: z.string().optional(),
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  sender_id: z.string().optional(),
  created_time: z.number().optional(),
  message: z.string().optional(),
})

const FacebookWebhookRatingsValueSchema = z.object({
  item: z.enum(FacebookWebhookFeedItem).optional(),
  verb: z.enum(FacebookWebhookVerb).optional(),
  post_id: z.string().optional(),
  sender_id: z.string().optional(),
  created_time: z.number().optional(),
  rating: z.number().optional(),
  review_text: z.string().optional(),
})

export const FacebookWebhookChangeSchema = z.union([
  z.object({
    field: z.literal(FacebookWebhookField.Feed),
    value: FacebookWebhookFeedValueSchema,
  }),
  z.object({
    field: z.literal(FacebookWebhookField.Comments),
    value: FacebookWebhookCommentsValueSchema,
  }),
  z.object({
    field: z.literal(FacebookWebhookField.Ratings),
    value: FacebookWebhookRatingsValueSchema,
  }),
])

export const FacebookWebhookBodySchema = z.object({
  object: z.enum(FacebookWebhookObject).optional(),
  entry: z.array(z.object({
    id: z.string().optional(),
    time: z.number().optional(),
    changes: z.array(FacebookWebhookChangeSchema).optional(),
  })).optional(),
})

export type FacebookWebhookBody = z.infer<typeof FacebookWebhookBodySchema>
export type FacebookWebhookChange = z.infer<typeof FacebookWebhookChangeSchema>
export type FacebookWebhookFeedChange = Extract<FacebookWebhookChange, { field: FacebookWebhookField.Feed }>

export const FacebookDataOptionSchema = z.object({
  content_category: z.enum(FacebookContentCategory).optional(),
  postId: z.string().optional(),
  storyId: z.string().optional(),
  videoId: z.string().optional(),
  photoId: z.string().optional(),
  permalinkUrl: z.string().optional(),
  webhook: FacebookWebhookChangeSchema.optional(),
})

export type FacebookDataOption = z.infer<typeof FacebookDataOptionSchema>
