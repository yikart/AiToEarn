import { XMediaCategory, XMediaType } from './twitter.enum'

export interface TwitterOAuthCredential {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
  scope?: string
}

export interface TwitterAPIError {
  title?: string
  detail?: string
  type?: string
  status?: number
}

interface TwitterResponse<TData, TIncludes = undefined, TMeta = undefined> {
  data?: TData
  errors?: TwitterAPIError[]
  includes?: TIncludes
  meta?: TMeta
}

export interface TwitterUserPublicMetrics {
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

export interface TwitterUserInfo {
  id: string
  name: string
  profileImageUrl?: string
  username: string
  verified?: boolean
  createdAt?: string
  protected?: boolean
  publicMetrics?: TwitterUserPublicMetrics
  withheld?: TwitterWithheld
}

export type TwitterUserInfoResponse = TwitterResponse<TwitterUserInfo>

export interface TwitterRevokeAccessResponse {
  revoked: boolean
}

interface TwitterFollowingData {
  following?: boolean
  pendingFollow?: boolean
}

export type TwitterFollowingResponse = TwitterResponse<TwitterFollowingData>

export interface XMediaUploadInitRequest {
  mediaType: XMediaType
  totalBytes: number
  mediaCategory: XMediaCategory
  shared: boolean
}

export interface XMediaUploadProcessingInfo {
  state?: 'succeeded' | 'in_progress' | 'pending' | 'failed'
  progressPercent?: number
  checkAfterSecs?: number
}

export interface XMediaUploadResponseData {
  id?: string
  mediaKey?: string
  expiresAfterSecs?: number
  size?: number
  processingInfo?: XMediaUploadProcessingInfo
  expiresAt?: string
  state?: string
}

export type XMediaUploadResponse = TwitterResponse<XMediaUploadResponseData>

export interface XChunkedMediaUploadRequest {
  media: Blob | Buffer | Uint8Array | ArrayBuffer
  media_id: string
  segment_index: number
}

export interface PostMedia {
  mediaIds: string[]
  taggedUserIds?: string[]
}

export interface PostReply {
  inReplyToTweetId: string
  excludeReplyUserIds?: string[]
}

export type XReplySettings = 'following' | 'mentionedUsers' | 'subscribers' | 'verified'

export interface XPostPoll {
  options: string[]
  durationMinutes: number
}

export interface XCreatePostRequest {
  text?: string
  media?: PostMedia
  reply?: PostReply
  quoteTweetId?: string
  replySettings?: XReplySettings
  poll?: XPostPoll
  madeWithAi?: boolean
}

export interface CreatePostResponseData {
  id?: string
  text?: string
}

export interface DeletePostResponseData {
  deleted?: boolean
}

export interface LikePostResponseData {
  liked?: boolean
}

export interface RePostResponseData {
  retweeted?: boolean
}

export type XCreatePostResponse = TwitterResponse<CreatePostResponseData>
export type XDeletePostResponse = TwitterResponse<DeletePostResponseData>
export type XLikePostResponse = TwitterResponse<LikePostResponseData>
export type XRePostResponse = TwitterResponse<RePostResponseData>
export type XBookmarkMutationResponse = TwitterResponse<Record<string, boolean>>
export type XHideReplyResponse = TwitterResponse<Record<string, boolean>>

export interface XPostPublicMetric {
  bookmarkCount?: number
  impressionCount?: number
  likeCount?: number
  replyCount?: number
  retweetCount?: number
  quoteCount?: number
}

export interface XPostAttachment {
  mediaKeys?: string[]
  mediaSourceTweetId?: string[]
  pollIds?: string[]
}

export interface XPostMediaMetadata {
  altText?: string
  durationMs?: number
  height?: number
  mediaKey?: string
  previewImageUrl?: string
  type?: string
  url?: string
  variants?: XTweetMediaVariant[]
  width?: number
}

export interface XPostDetailResponseData {
  id?: string
  text?: string
  authorId?: string
  attachments?: XPostAttachment
  communityId?: string
  conversationId?: string
  createdAt?: string
  displayTextRange?: number[]
  editHistoryTweetIds?: string[]
  inReplyToUserId?: string
  mediaMetadata?: XPostMediaMetadata[]
  publicMetrics?: XPostPublicMetric
  referencedTweets?: Array<{
    type?: 'retweeted' | 'quoted' | 'replied_to'
    id?: string
  }>
}

export interface XTweetMediaVariant {
  bitRate?: number
  contentType?: string
  url?: string
}

export interface XTweetIncludeMedia {
  mediaKey?: string
  type?: string
  url?: string
  previewImageUrl?: string
  variants?: XTweetMediaVariant[]
}

export interface XIncludes {
  media?: XTweetIncludeMedia[]
  users?: TwitterUserInfo[]
}

export type XGetPostDetailResponse = TwitterResponse<XPostDetailResponseData, XIncludes>

export interface XUserTimelineRequest {
  sinceId?: string
  untilId?: string
  maxResults?: number
  paginationToken?: string
  exclude?: string[]
  startTime?: string
  endTime?: string
  expansions?: string[]
  tweetFields?: string[]
  mediaFields?: string[]
  pollFields?: string[]
  userFields?: string[]
  placeFields?: string[]
}

export interface XUserTimelineResponseMeta {
  newestId?: string
  oldestId?: string
  resultCount?: number
  nextToken?: string
  previousToken?: string
}

export type XUserTimelineResponse = TwitterResponse<
  XPostDetailResponseData[],
  XIncludes,
  XUserTimelineResponseMeta
>

export type XMentionsTimelineRequest = Omit<XUserTimelineRequest, 'exclude'>
export type XMentionsTimelineResponse = XUserTimelineResponse
export type XSearchTweetsRequest = Omit<XUserTimelineRequest, 'exclude'>
export type XSearchTweetsResponse = XUserTimelineResponse
export type XTweetListRequest = Pick<
  XUserTimelineRequest,
  'maxResults' | 'paginationToken' | 'expansions' | 'tweetFields' | 'mediaFields' | 'pollFields' | 'userFields' | 'placeFields'
>
export type XTweetListResponse = XUserTimelineResponse
export type XUserListRequest = Pick<
  XUserTimelineRequest,
  'maxResults' | 'paginationToken' | 'userFields' | 'tweetFields' | 'expansions'
>
export type XUserListResponse = TwitterResponse<
  TwitterUserInfo[],
  undefined,
  XUserTimelineResponseMeta
>

export interface XListInfo {
  id: string
  name: string
  description?: string
  followerCount?: number
  memberCount?: number
  ownerId?: string
  private?: boolean
  createdAt?: string
}

export interface XListRequest {
  maxResults?: number
  paginationToken?: string
  listFields?: string[]
  expansions?: string[]
  userFields?: string[]
}

export type XListListResponse = TwitterResponse<
  XListInfo[],
  XIncludes,
  XUserTimelineResponseMeta
>

export type XLikedPostsRequest = Pick<
  XUserTimelineRequest,
  'maxResults' | 'paginationToken' | 'expansions' | 'tweetFields' | 'mediaFields' | 'pollFields' | 'userFields' | 'placeFields'
>
export type XLikedPostsResponse = XUserTimelineResponse

export interface XBookmarksTimelineRequest {
  maxResults?: number
  paginationToken?: string
  expansions?: string[]
  tweetFields?: string[]
  mediaFields?: string[]
  pollFields?: string[]
  userFields?: string[]
  placeFields?: string[]
}

export type XBookmarksTimelineResponse = TwitterResponse<
  XPostDetailResponseData[],
  XIncludes,
  XUserTimelineResponseMeta
>

export interface XMediaMetadataAltText {
  text: string
}

export interface XMediaMetadata {
  altText?: XMediaMetadataAltText
}

export interface XCreateMediaMetadataRequest {
  id: string
  metadata: XMediaMetadata
}

export type XCreateMediaMetadataResponse = TwitterResponse<Record<string, unknown>>
