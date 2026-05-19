// ============ 通用类型 ============

export interface TwitterPublicMetrics {
  followersCount?: number
  followingCount?: number
  tweetCount?: number
  listedCount?: number
  likeCount?: number
  mediaCount?: number
}

export interface TwitterWithheld {
  copyright?: boolean
  countryCodes?: string[]
  scope?: string
}

export interface TwitterUser {
  id: string
  name: string
  username: string
  profileImageUrl?: string
  verified?: boolean
  createdAt?: string
  protected?: boolean
  publicMetrics?: TwitterPublicMetrics
  withheld?: TwitterWithheld
}

export interface TwitterMediaVariant {
  bitRate?: number
  contentType?: string
  url?: string
}

export interface TwitterMediaItem {
  mediaKey: string
  type: string
  url?: string
  previewImageUrl?: string
  durationMs?: number
  height?: number
  width?: number
  altText?: string
  variants?: TwitterMediaVariant[]
}

export interface TwitterTweetMediaMetadata extends TwitterMediaItem {
  altText?: string
}

export interface TwitterTweet {
  id: string
  text: string
  authorId: string
  attachments?: {
    mediaKeys?: string[]
    mediaSourceTweetId?: string[]
    pollIds?: string[]
  }
  communityId?: string
  conversationId?: string
  createdAt?: string
  displayTextRange?: number[]
  editHistoryTweetIds?: string[]
  inReplyToUserId?: string
  mediaMetadata?: TwitterTweetMediaMetadata[]
  publicMetrics?: {
    bookmarkCount?: number
    impressionCount?: number
    likeCount?: number
    replyCount?: number
    retweetCount?: number
    quoteCount?: number
  }
  referencedTweets?: {
    type: 'retweeted' | 'quoted' | 'replied_to'
    id: string
  }[]
}

export interface TwitterList {
  id: string
  name: string
  description?: string
  followerCount?: number
  memberCount?: number
  ownerId?: string
  private?: boolean
  createdAt?: string
}

export interface TwitterError {
  title?: string
  detail?: string
  type?: string
  status?: number
}

export interface TwitterPaginationMeta {
  newestId?: string
  oldestId?: string
  resultCount?: number
  nextToken?: string
  previousToken?: string
}

// ============ 分页请求通用参数 ============

export interface TwitterPaginationParams {
  maxResults?: string
  paginationToken?: string
  sinceId?: string
  untilId?: string
  startTime?: string
  endTime?: string
}

export type TwitterTimelineExclude = 'retweets' | 'replies'

export type TwitterTimelinePaginationParams = TwitterPaginationParams & {
  exclude?: TwitterTimelineExclude[]
}

// ============ Response 类型 ============

export interface TwitterAuthUrlVo {
  url: string
  taskId: string
  state: string
}

export interface TwitterAuthTaskInfoVo {
  state: string
  status: 0 | 1
  userId: string
  taskId: string
  accountId?: string
  spaceId?: string
  callbackUrl?: string
  callbackMethod?: 'GET' | 'POST'
}

export interface TwitterUserInfoResponseVo {
  data: TwitterUser
  errors?: TwitterError[]
}

export interface TwitterTimelineResponseVo {
  data: TwitterTweet[]
  errors?: TwitterError[]
  includes?: {
    media?: TwitterMediaItem[]
    users?: TwitterUser[]
  }
  meta?: TwitterPaginationMeta
}

export interface TwitterResolveTweetVo {
  tweetId: string
  tweetUrl: string
  resolvedUrl: string
}

export interface TwitterPostDetailResponseVo {
  data: TwitterTweet
  errors?: TwitterError[]
  includes?: {
    media?: TwitterMediaItem[]
    users?: TwitterUser[]
  }
  tweetId: string
  tweetUrl: string
}

export interface TwitterUserListResponseVo {
  data: TwitterUser[]
  errors?: TwitterError[]
  meta?: TwitterPaginationMeta
}

export interface TwitterListResponseVo {
  data: TwitterList[]
  errors?: TwitterError[]
  includes?: {
    media?: TwitterMediaItem[]
    users?: TwitterUser[]
  }
  meta?: TwitterPaginationMeta
}

export interface TwitterCreatePostResponseVo {
  data: { id: string, text: string }
  errors?: TwitterError[]
}

export interface TwitterLikePostResponseVo {
  data: { liked: boolean }
  errors?: TwitterError[]
}

export interface TwitterRePostResponseVo {
  data: { retweeted: boolean }
  errors?: TwitterError[]
}

export interface TwitterBookmarkMutationResponseVo {
  data: Record<string, boolean>
  errors?: TwitterError[]
}

export interface TwitterHideReplyResponseVo {
  data: Record<string, boolean>
  errors?: TwitterError[]
}

// ============ 发布选项类型 ============

export type TwitterReplySettings = 'following' | 'mentionedUsers' | 'subscribers' | 'verified'

export interface TwitterPollConfig {
  options: string[]
  durationMinutes: number
  replySettings?: TwitterReplySettings
}

export interface TwitterMediaMetadata {
  altText?: string
}

export interface TwitterPublishOption {
  replySettings?: TwitterReplySettings
  madeWithAi?: boolean
  poll?: TwitterPollConfig
  mediaTaggedUserIds?: string[]
  mediaMetadata?: TwitterMediaMetadata[]
}
