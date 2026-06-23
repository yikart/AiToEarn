import type { PlatformGraphQueryInput } from '../platforms.utils'
import type { ThreadsReplyControl } from './threads.schema'

export enum ThreadsMediaType {
  Text = 'TEXT',
  Image = 'IMAGE',
  Video = 'VIDEO',
  Carousel = 'CAROUSEL',
}

export enum ThreadsPublishedMediaType {
  Text = 'TEXT',
  TextPost = 'TEXT_POST',
  Image = 'IMAGE',
  Video = 'VIDEO',
  Carousel = 'CAROUSEL',
}

export enum ThreadsOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  ExchangeToken = 'th_exchange_token',
  RefreshToken = 'th_refresh_token',
}

export enum ThreadsContainerStatusCode {
  Ready = 'READY',
  InProgress = 'IN_PROGRESS',
  Error = 'ERROR',
  Expired = 'EXPIRED',
  Finished = 'FINISHED',
  Published = 'PUBLISHED',
  LegacyFailed = 'FAILED',
}

export enum ThreadsPublishResultStatus {
  Processing = 102,
  Published = 200,
}

export interface ThreadsOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface ThreadsLongLivedTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface ThreadsUserProfile {
  id: string
  username: string
  name: string
  threads_profile_picture_url?: string
  threads_biography?: string
}

export interface ThreadsContainerResponse {
  id: string
}

export interface ThreadsPublishResponse {
  id: string
}

export interface ThreadsContainerStatusResponse {
  id?: string
  status?: ThreadsContainerStatusCode
  permalink?: string
}

export interface ThreadsPublishedPost {
  id?: string
  status?: ThreadsContainerStatusCode
  permalink?: string
  text?: string
  timestamp?: string
  username?: string
}

export type ThreadsGraphQueryInput = PlatformGraphQueryInput

export interface ThreadsPost {
  id: string
  media_type?: ThreadsPublishedMediaType
  media_url?: string
  permalink?: string
  owner?: { id?: string }
  text?: string
  timestamp?: string
  shortcode?: string
  thumbnail_url?: string
  username?: string
}

export interface ThreadsPostListResponse {
  data?: ThreadsPost[]
  paging?: {
    cursors?: { before?: string, after?: string }
    next?: string
    previous?: string
  }
}

export interface ThreadsReplyListResponse {
  data?: Array<{
    id: string
    text?: string
    username?: string
    timestamp?: string
    permalink?: string
  }>
  paging?: {
    cursors?: { before?: string, after?: string }
    next?: string
    previous?: string
  }
}

export interface ThreadsManageReplyResponse {
  success?: boolean
}

export interface ThreadsMediaChildrenResponse {
  data: Array<{ id: string }>
}

export interface ThreadsInsightsMetricResult {
  name: string
  total_value?: { value?: number }
  values?: Array<{ value?: number, end_time?: string }>
}

export interface ThreadsInsightsResponse {
  data?: ThreadsInsightsMetricResult[]
}

export interface ThreadsLocation {
  id: string
  name?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  postal_code?: string
}

export interface ThreadsLocationSearchResponse {
  data?: ThreadsLocation[]
}

export interface ThreadsCreateContainerInput {
  mediaType: ThreadsMediaType
  text?: string
  imageUrl?: string
  videoUrl?: string
  children?: string
  isCarouselItem?: boolean
  topicTag?: string
  locationId?: string
  replyToId?: string
  replyControl?: ThreadsReplyControl
  allowlistedCountryCodes?: string[]
  altText?: string
  linkAttachmentUrl?: string
  quotePostId?: string
  autoPublishText?: boolean
}
