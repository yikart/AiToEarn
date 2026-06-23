import type { TikTokPostSource, TikTokPrivacyLevel } from './tiktok.schema'

export interface TikTokApiResponse<T> {
  data: T
  error?: {
    code: string
    message: string
    log_id: string
  }
}

export type TikTokRequestParamValue = string | number | boolean | undefined

export interface TikTokRequestOptions {
  method?: string
  params?: Record<string, TikTokRequestParamValue>
  headers?: Record<string, string>
}

export type TikTokContentRequestBody
  = | Record<string, never>
    | TikTokVideoPublishInitRequest
    | TikTokPhotoPublishInitRequest
    | TikTokPublishStatusRequest
    | TikTokPublishCancelRequest

export interface TikTokOAuthResponse {
  access_token: string
  expires_in: number
  open_id: string
  refresh_token: string
  refresh_expires_in: number
  scope: string
  token_type: string
}

export interface TikTokUserInfo {
  open_id: string
  union_id?: string
  avatar_url?: string
  username?: string
  display_name?: string
  bio_description?: string
  follower_count?: number
  following_count?: number
  likes_count?: number
  video_count?: number
}

export interface TikTokVideoInfo {
  id: string
  create_time?: number
  title?: string
  video_description?: string
  duration?: number
  cover_image_url?: string
  share_url?: string
  embed_link?: string
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

export interface TikTokVideoQueryResponse {
  videos?: TikTokVideoInfo[]
  cursor?: number
  has_more?: boolean
}

export interface TikTokCreatorInfo {
  creator_avatar_url: string
  creator_username: string
  creator_nickname: string
  privacy_level_options: TikTokPrivacyLevel[]
  comment_disabled: boolean
  duet_disabled: boolean
  stitch_disabled: boolean
  max_video_post_duration_sec: number
}

export interface TikTokPublishResponse {
  publish_id: string
  upload_url?: string
}

export interface TikTokVideoPublishInitRequest {
  post_info: TikTokVideoPostInfo
  source_info: TikTokVideoSourceInfo
}

export interface TikTokPhotoPublishInitRequest {
  media_type: 'PHOTO'
  post_mode: 'DIRECT_POST'
  post_info: TikTokPhotoPostInfo
  source_info: TikTokPhotoSourceInfo
}

export interface TikTokPublishStatusRequest {
  publish_id: string
}

export type TikTokPublishCancelRequest = TikTokPublishStatusRequest

export interface TikTokVideoPostInfo {
  title?: string
  privacy_level: TikTokPrivacyLevel
  disable_comment?: boolean
  disable_duet?: boolean
  disable_stitch?: boolean
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
  is_aigc?: boolean
}

export type TikTokVideoSourceInfo
  = | { source: TikTokPostSource.FileUpload, video_size: number, chunk_size: number, total_chunk_count: number }
    | { source: TikTokPostSource.PullFromUrl, video_url: string }

export interface TikTokPhotoPostInfo {
  title?: string
  description?: string
  privacy_level: TikTokPrivacyLevel
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
  disable_comment?: boolean
  auto_add_music?: boolean
}

export interface TikTokPhotoSourceInfo {
  source: TikTokPostSource.PullFromUrl
  photo_images: string[]
  photo_cover_index: number
}

export enum TikTokPublishStatus {
  ProcessingUpload = 'PROCESSING_UPLOAD',
  ProcessingDownload = 'PROCESSING_DOWNLOAD',
  SendToUserInbox = 'SEND_TO_USER_INBOX',
  PublishComplete = 'PUBLISH_COMPLETE',
  Failed = 'FAILED',
}

export enum TikTokOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export interface TikTokPublishStatusResponse {
  status: TikTokPublishStatus
  fail_reason?: string
  publicaly_available_post_id?: string[]
  uploaded_bytes?: number
}

export interface TikTokUploadPlan {
  chunkSize: number
  totalChunkCount: number
  ranges: Array<[number, number]>
}

export enum TikTokContentPostingEvent {
  PostPublishComplete = 'post.publish.complete',
  PostPublishInboxDelivered = 'post.publish.inbox_delivered',
  PostPublishPubliclyAvailable = 'post.publish.publicly_available',
  PostPublishNoLongerPublicalyAvailable = 'post.publish.no_longer_publicaly_available',
  PostPublishFailed = 'post.publish.failed',
}

export enum TikTokContentPostingPublishType {
  DirectPublish = 'DIRECT_PUBLISH',
  InboxShare = 'INBOX_SHARE',
}

export interface TikTokContentPostingWebhookContent {
  publish_id: string
  publish_type?: TikTokContentPostingPublishType
  post_id?: string
  reason?: string
}

export interface TikTokContentPostingWebhookBody {
  client_key: string
  event: TikTokContentPostingEvent
  create_time: number
  user_openid: string
  content: string
}
