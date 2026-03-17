export type EngagementPlatform
  = | 'bilibili'
    | 'douyin'
    | 'facebook'
    | 'wxGzh'
    | 'instagram'
    | 'KWAI'
    | 'pinterest'
    | 'threads'
    | 'tiktok'
    | 'twitter'
    | 'xhs'
    | 'youtube'

export type EngagementMediaType = 'video' | 'image' | 'article'

export interface EngagementPostsParams {
  platform: EngagementPlatform
  uid: string
  page: number
  pageSize: number
}

export interface EngagementPostItem {
  postId?: string
  id: string
  platform: EngagementPlatform
  title: string
  content: string
  thumbnail: string
  mediaType: EngagementMediaType
  permaLink: string
  publishTime: number // ms timestamp
  viewCount: number
  commentCount: number
  likeCount: number
  shareCount: number
  clickCount: number
  impressionCount: number
  favoriteCount: number
}

export interface EngagementPostsResponse {
  total?: number
  posts: EngagementPostItem[]
  hasMore?: boolean
  cursor?: {
    before?: string
    after?: string
  }
}

export interface EngagementCommentItem {
  id: string
  postId: string
  userId: string
  userName?: string
  userAvatar?: string
  content: string
  likeCount: number
  createdAt: number // ms timestamp
  parentId?: string // 回复时存在
}

export interface EngagementCommentsParams {
  postId: string
  page: number
  pageSize: number
}

export interface EngagementCommentsResponse {
  total: number
  comments: EngagementCommentItem[]
  hasMore: boolean
}

export interface EngagementReplyParams {
  postId: string
  parentId?: string
  content: string
}

// 新版：平台一级评论（支持 keyset/offset 分页）
export type PostCommentPlatform = 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'tiktok'

export interface PostCommentsAuthor {
  id?: string
  name?: string
  avatar?: string
}

export interface PostCommentItemV2 {
  id: string
  message: string
  author: PostCommentsAuthor
  createdAt: string // ISO 8601
  hasReplies: boolean
}

export interface PostCommentsParamsV2 {
  accountId: string
  platform: PostCommentPlatform
  postId: string
  pagination?: {
    before?: string
    after?: string
    limit?: number
  }
}

export interface PostCommentsResponseV2 {
  comments: PostCommentItemV2[]
  total?: number // offset 模式才会返回
  cursor?: {
    before?: string
    after?: string
  }
}

export interface PublishPostCommentParams {
  accountId: string
  platform: PostCommentPlatform
  postId: string
  message: string // 1-500 chars
}

export interface PublishCommentReplyParams {
  accountId: string
  platform: PostCommentPlatform
  commentId: string
  message: string // 1-500 chars
}

export interface CommentRepliesParams {
  accountId: string
  platform: PostCommentPlatform
  commentId: string
  pagination?: {
    before?: string
    after?: string
    limit?: number
  }
}

export interface CommentRepliesResponse {
  comments: PostCommentItemV2[]
  cursor?: {
    before?: string
    after?: string
  }
}
