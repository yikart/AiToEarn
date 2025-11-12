import { XMediaCategory, XMediaType } from './twitter.enum'

export interface TwitterOAuthCredential {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface TwitterUserInfo {
  id: string
  name: string
  profile_image_url: string
  username: string
  verified: boolean
  created_at: string
  protected: boolean
}

interface TwitterAPIError {
  title: string
  detail: string
  type: string
  status: number
}

export interface TwitterUserInfoResponse {
  data: TwitterUserInfo
  errors?: TwitterAPIError[]
}

export interface TwitterRevokeAccessResponse {
  revoked: boolean
  errors?: TwitterAPIError[]
}

interface TwitterFollowingData {
  following: boolean
  pending_follow: boolean
}
export interface TwitterFollowingResponse {
  data: TwitterFollowingData
  errors?: TwitterAPIError[]
}

export interface XMediaUploadInitRequest {
  // command: 'INIT' | 'APPEND' | 'FINALIZE'
  media_type: XMediaType
  total_bytes: number
  media_category: XMediaCategory
  shared: boolean
}

export interface XMediaUploadProcessingInfo {
  state: 'succeeded' | 'in_progress' | 'pending' | 'failed'
  progress_percent?: number
  check_after_secs?: number
}

export interface XMediaUploadResponseData {
  id: string
  media_key: string
  expires_after_secs: number
  size: number
  processing_info: XMediaUploadProcessingInfo
  expires_at?: string // ISO 8601 format
  state?: string // e.g., "succeeded", "failed"
}

export interface XMediaUploadResponse {
  data: XMediaUploadResponseData
  errors?: TwitterAPIError[]
}

export interface XChunkedMediaUploadRequest {
  media: Blob
  media_id: string
  segment_index: number
}

export interface Geo {
  place_id: string
}

export interface PostMedia {
  media_ids: string[]
  tagged_users?: string[]
}

enum PostPollReplySettings {
  // following, mentionedUsers, subscribers, verified
  FOLLOWING = 'following',
  MENTIONED_USERS = 'mentionedUsers',
  SUBSCRIBERS = 'subscribers',
  VERIFIED = 'verified',
}

export interface PostPoll {
  options: string[]
  duration_minutes: number
  reply_settings?: PostPollReplySettings
}

export interface postReply {
  in_reply_to_tweet_id: string
  exclude_reply_user_ids?: string[]
}
export interface XCreatePostRequest {
  card_uri?: string
  community_id?: string
  direct_message_deep_link?: string
  for_super_followers_only?: boolean
  geo?: Geo
  media?: PostMedia
  nullcast?: boolean
  poll?: PostPoll
  quote_tweet_id?: string
  reply?: postReply
  reply_settings?: PostPollReplySettings
  text?: string
}

export interface XGetPostDetailRequest {
  'tweet.fields'?: string[]
  'expansions'?: string[]
  'media.fields'?: string[]
  'poll.fields'?: string[]
  'user.fields'?: string[]
  'place.fields'?: string[]
}

export interface XPostAttachment {
  'attachments.media_keys'?: string[]
  'media_source_tweet_id'?: string
  'poll_ids'?: string[]
}

export interface XPostPublicMetric {
  bookmark_count: number
  impression_count: number
  like_count: number
  reply_count: number
  retweet_count: number
  quote_count: number
}

export interface XGetPostDetailResponseData {
  id: string
  text: string
  username: string
  author_id: string
  attachments?: XPostAttachment
  community_id?: string
  conversation_id: string
  created_at: string
  display_text_range: number[]
  edit_history_tweet_ids?: string[]
  geo?: Geo
  in_reply_to_user_id?: string
  public_metrics: XPostPublicMetric
}

export interface XGetPostDetailResponse {
  data: XGetPostDetailResponseData
  errors?: TwitterAPIError[]
}

export interface RePostResponseData {
  id: string
  retweeted: boolean
}

export interface LikePostResponseData {
  liked: boolean
}

export interface CreatePostResponseData {
  id: string
  text: string
}

export interface DeletePostResponseData {
  deleted: boolean
}

export interface PublicMetrics {
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  impression_count: number
  bookmark_count: number
}

export interface PostAttachment {
  media_keys?: string[]
}

export interface XPostDetailResponseData {
  public_metrics: PublicMetrics
  id: string
  text: string
  author_id: string
  created_at: string
}

export interface XCreatePostResponse {
  data: CreatePostResponseData
  errors?: TwitterAPIError[]
}

export interface XDeletePostResponse {
  data: DeletePostResponseData
  errors?: TwitterAPIError[]
}

export interface XLikePostResponse {
  data: LikePostResponseData
  errors?: TwitterAPIError[]
}

export interface XRePostResponse {
  data: RePostResponseData
  errors?: TwitterAPIError[]
}

export interface XPostDetailResponse {
  data: XPostDetailResponseData
  errors?: TwitterAPIError[]
}

export interface XUserTimelineRequest {
  'since_id'?: string
  'until_id'?: string
  'max_results'?: number
  'pagination_token'?: string
  'exclude'?: string
  'start_time'?: string // ISO 8601 format
  'end_time'?: string // ISO 8601 format
  'expansions'?: string
  'tweet.fields'?: string
  'media.fields'?: string
  'poll.fields'?: string
  'user.fields'?: string
  'place.fields'?: string
}

export interface XUserTimelineResponseMeta {
  newest_id: string
  oldest_id: string
  result_count: number
  next_token?: string
  previous_token?: string
}

export interface XTweetIncludeMedia {
  url: string
  preview_image_url: string
}

export interface XUserTimelineResponse {
  data: XPostDetailResponseData[]
  meta: XUserTimelineResponseMeta
  errors?: TwitterAPIError[]
  includes: {
    media?: XTweetIncludeMedia[]
  }
}

export interface XDeleteTweetData {
  deleted: boolean
}

export interface XDeleteTweetResponse {
  data: XDeleteTweetData
  errors?: TwitterAPIError[]
}
