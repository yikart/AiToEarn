import type { PlatformGraphQueryInput } from '../platforms.utils'
import type { InstagramMediaType } from './instagram.schema'

export interface GraphApiResponse<T> {
  data: T
  paging?: {
    cursors?: { before: string, after: string }
    next?: string
    previous?: string
  }
}

export type InstagramGraphQueryInput = PlatformGraphQueryInput

export enum InstagramOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  ExchangeToken = 'ig_exchange_token',
  RefreshToken = 'ig_refresh_token',
}

interface InstagramInsightValueBreakdown {
  carousel_album_engagement?: number
  comment_count?: number
  follower_count?: number
  like_count?: number
  play_count?: number
  save_count?: number
  share_count?: number
}

export interface InstagramInsightValue {
  value?: number | string | InstagramInsightValueBreakdown
  end_time?: string
}

export interface InstagramInsight {
  name: string
  period?: string
  values?: InstagramInsightValue[]
  title?: string
  description?: string
  id?: string
}

export interface InstagramCommentReply {
  id: string
  text?: string
  username?: string
  timestamp?: string
}

export interface InstagramComment {
  id: string
  text?: string
  username?: string
  timestamp?: string
  like_count?: number
  replies?: GraphApiResponse<InstagramCommentReply[]>
}

export interface InstagramUser {
  id: string
  user_id?: string
  username?: string
  name?: string
  account_type?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
}

export type InstagramPublishedMediaType = InstagramMediaType | 'VIDEO'

export interface InstagramMedia {
  id: string
  caption?: string
  media_type?: InstagramPublishedMediaType
  media_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

export interface InstagramCommentCreateResponse {
  id: string
}

export enum InstagramMediaContainerStatusCode {
  Error = 'ERROR',
  Expired = 'EXPIRED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
}

export interface InstagramMediaContainerStatus {
  statusCode?: InstagramMediaContainerStatusCode
  status?: string
}

export interface InstagramContentPublishingLimit {
  quotaUsage?: number
  quotaTotal?: number
  quotaDuration?: number
}

export enum InstagramWebhookObject {
  Instagram = 'instagram',
}

export enum InstagramWebhookChangeField {
  Comments = 'comments',
  Media = 'media',
  Mentions = 'mentions',
}

export enum InstagramWebhookMediaStatus {
  Error = 'ERROR',
  Published = 'PUBLISHED',
}

export interface InstagramWebhookMediaChangeValue {
  id?: string
  media_id?: string
  comment_id?: string
  status?: InstagramWebhookMediaStatus
  permalink?: string
}

export interface InstagramWebhookCommentChangeValue {
  id?: string
  comment_id?: string
  text?: string
  parent_id?: string
  media?: {
    id?: string
    media_product_type?: string
  }
  from?: {
    id?: string
    username?: string
  }
}

export interface InstagramWebhookMentionChangeValue {
  id?: string
  media_id?: string
  comment_id?: string
  permalink?: string
}

export type InstagramWebhookChange
  = | {
    field: InstagramWebhookChangeField.Media
    value: InstagramWebhookMediaChangeValue
  }
  | {
    field: InstagramWebhookChangeField.Comments
    value: InstagramWebhookCommentChangeValue
  }
  | {
    field: InstagramWebhookChangeField.Mentions
    value: InstagramWebhookMentionChangeValue
  }

export interface MetaWebhookEntry {
  id?: string
  time?: number
  changes?: InstagramWebhookChange[]
}

export interface InstagramWebhookBody {
  object?: InstagramWebhookObject
  entry?: MetaWebhookEntry[]
}
