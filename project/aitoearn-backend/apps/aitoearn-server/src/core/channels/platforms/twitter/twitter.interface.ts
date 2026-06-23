import type { Media } from '@xdevplatform/xdk'
import { TwitterMediaProcessingState, TwitterPostMediaType, TwitterReplySettings } from './twitter.enum'

export type TwitterMediaType = NonNullable<Media.InitializeUploadRequest['mediaType']>
export type TwitterMediaCategory = Media.InitializeUploadRequest['mediaCategory']

export interface TwitterCreatePostBody {
  text: string
  media?: { media_ids: string[] }
  reply?: { in_reply_to_tweet_id: string }
  quote_tweet_id?: string
  reply_settings?: TwitterReplySettings
  poll?: { options: string[], duration_minutes: number }
  made_with_ai?: boolean
  paid_partnership?: boolean
}

export interface TwitterMediaProcessingInfo {
  state?: TwitterMediaProcessingState
  checkAfterSecs?: number
  check_after_secs?: number
  progressPercent?: number
  progress_percent?: number
  error?: {
    code?: number
    name?: string
    message?: string
  }
}

export interface TwitterMediaUploadData {
  id?: string
  media_id_string?: string
  processingInfo?: TwitterMediaProcessingInfo
  processing_info?: TwitterMediaProcessingInfo
}

export interface TwitterUserMetrics {
  followers_count?: number
  following_count?: number
  tweet_count?: number
  listed_count?: number
  like_count?: number
  followersCount?: number
  followingCount?: number
  tweetCount?: number
  listedCount?: number
  likeCount?: number
}

export interface TwitterUserAnalyticsData {
  id: string
  name?: string
  username?: string
  profile_image_url?: string
  profileImageUrl?: string
  verified?: boolean
  public_metrics?: TwitterUserMetrics
  publicMetrics?: TwitterUserMetrics
}

export interface TwitterUserAnalyticsResponse {
  data?: TwitterUserAnalyticsData
}

export interface TwitterPostMetrics {
  retweet_count?: number
  reply_count?: number
  like_count?: number
  quote_count?: number
  bookmark_count?: number
  impression_count?: number
  retweetCount?: number
  replyCount?: number
  likeCount?: number
  quoteCount?: number
  bookmarkCount?: number
  impressionCount?: number
}

export interface TwitterPostData {
  id?: string
  text?: string
  author_id?: string
  authorId?: string
  created_at?: string
  createdAt?: string
  public_metrics?: TwitterPostMetrics
  publicMetrics?: TwitterPostMetrics
  conversation_id?: string
  conversationId?: string
  attachments?: {
    media_keys?: string[]
    mediaKeys?: string[]
  }
}

export interface TwitterPostResponse {
  data?: TwitterPostData
  includes?: TwitterPostIncludes
}

export interface TwitterPostMedia {
  media_key?: string
  mediaKey?: string
  type?: TwitterPostMediaType | string
}

export interface TwitterPostIncludes {
  users?: TwitterUserAnalyticsData[]
  media?: TwitterPostMedia[]
}

export interface TwitterPostListResponse {
  data?: TwitterPostData[]
  includes?: TwitterPostIncludes
  meta?: {
    nextToken?: string
    next_token?: string
    previous_token?: string
    result_count?: number
    newest_id?: string
    oldest_id?: string
  }
}

export interface TwitterTimelineListInput {
  startTime?: string
  endTime?: string
  sinceId?: string
  untilId?: string
  paginationToken?: string
  maxResults?: number
  exclude?: string[]
}
