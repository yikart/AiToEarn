import { z } from 'zod'

export interface BilibiliUploadInfo {
  uploadToken: string
}

export interface BilibiliArchiveSubmitResult {
  resourceId: string
}

export interface BilibiliUserStat {
  following?: number | string
  follower?: number | string
  arc_passed_total?: number | string
}

export interface BilibiliArchiveStat {
  title?: string
  ptime?: number | string
  view?: number | string
  like?: number | string
  coin?: number | string
  favorite?: number | string
  share?: number | string
  danmaku?: number | string
  reply?: number | string
}

export interface BilibiliArchiveTypeChild {
  description: string
  id: number
  name: string
  parent: number
}

export interface BilibiliArchiveTypeItem {
  children: BilibiliArchiveTypeChild[]
  description: string
  id: number
  name: string
  parent: number
}

export interface BilibiliArchiveListItem {
  addit_info?: {
    reject_reason?: string
    state?: number
    state_desc?: string
  }
  copyright?: number
  cover?: string
  ctime?: number
  desc?: string
  no_reprint?: number
  ptime?: number
  resource_id?: string
  tag?: string
  tid?: number
  title?: string
  video_info?: {
    cid?: number
    duration?: number
    filename?: string
    iframe_url?: string
    share_url?: string
  }
}

export interface BilibiliArchiveListData {
  list?: BilibiliArchiveListItem[]
  page?: {
    pn?: number
    ps?: number
    total?: number
  }
}

export interface BilibiliArchiveSubmitBody {
  title: string
  tid: number
  tag: string
  copyright: 1 | 2
  no_reprint: 0 | 1
  desc: string
  cover?: string
  source?: string
  topic_id?: number
  mission_id?: number
}

export interface BilibiliArchiveVideoInitBody {
  name: string
  utype: '0'
}

export type BilibiliSignedRequestBody = BilibiliArchiveSubmitBody | BilibiliArchiveVideoInitBody

export interface BilibiliApiResponse<T> {
  code: number
  message: string
  data?: T
}

export enum BilibiliOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export enum BilibiliArchiveReviewState {
  Open = 0,
  Pending = -1,
}

export interface BilibiliArchiveDetail {
  resourceId: string
  title: string
  description?: string
  state: BilibiliArchiveReviewState | number
  stateDesc: string
}

export enum BilibiliWebhookEvent {
  VerifyWebhooks = 'verify_webhooks',
  VideoOpen = 'video_open',
  VideoFail = 'video_fail',
  PublishVideo = 'publish_video',
}

const BilibiliTimestampSchema = z.union([z.number(), z.string()])

const BilibiliVerifyWebhooksContentSchema = z.object({
  data: z.union([z.number(), z.string()]),
})

const BilibiliOpenHomeVideoContentSchema = z.object({
  openid: z.string(),
  client_id: z.string(),
  resource_id: z.string(),
  state: z.union([z.number(), z.string()]),
  state_desc: z.string(),
})

const BilibiliLegacyPublishVideoContentSchema = z.object({
  share_id: z.string(),
  item_id: z.string(),
  video_id: z.string(),
  has_default_hashtag: z.boolean(),
})

export const BilibiliVerifyWebhooksBodySchema = z.object({
  event: z.literal(BilibiliWebhookEvent.VerifyWebhooks),
  content: BilibiliVerifyWebhooksContentSchema,
  timestamp: BilibiliTimestampSchema,
})

export const BilibiliVideoOpenWebhookBodySchema = z.object({
  event: z.literal(BilibiliWebhookEvent.VideoOpen),
  content: BilibiliOpenHomeVideoContentSchema,
  timestamp: BilibiliTimestampSchema,
})

export const BilibiliVideoFailWebhookBodySchema = z.object({
  event: z.literal(BilibiliWebhookEvent.VideoFail),
  content: BilibiliOpenHomeVideoContentSchema,
  timestamp: BilibiliTimestampSchema,
})

export const BilibiliPublishVideoWebhookBodySchema = z.object({
  event: z.literal(BilibiliWebhookEvent.PublishVideo),
  from_user_id: z.string(),
  client_key: z.string(),
  log_id: z.string(),
  content: BilibiliLegacyPublishVideoContentSchema,
})

export const BilibiliWebhookBodySchema = z.discriminatedUnion('event', [
  BilibiliVerifyWebhooksBodySchema,
  BilibiliVideoOpenWebhookBodySchema,
  BilibiliVideoFailWebhookBodySchema,
  BilibiliPublishVideoWebhookBodySchema,
])

export type BilibiliVerifyWebhooksBody = z.infer<typeof BilibiliVerifyWebhooksBodySchema>
export type BilibiliVideoOpenWebhookBody = z.infer<typeof BilibiliVideoOpenWebhookBodySchema>
export type BilibiliVideoFailWebhookBody = z.infer<typeof BilibiliVideoFailWebhookBodySchema>
export type BilibiliPublishVideoWebhookBody = z.infer<typeof BilibiliPublishVideoWebhookBodySchema>
export type BilibiliWebhookBody = z.infer<typeof BilibiliWebhookBodySchema>

export const BilibiliPublishDataOptionSchema = z.object({
  resourceId: z.string().optional(),
  shareId: z.string().optional(),
  finalVideoId: z.string().optional(),
  webhook: BilibiliWebhookBodySchema.optional(),
})

export type BilibiliPublishDataOption = z.infer<typeof BilibiliPublishDataOptionSchema>
