/**
 * 平台交互统一类型定义
 */

import { PlatType } from '@/app/config/platConfig'
import { PLUGIN_SUPPORTED_PLATFORMS } from '../types/baseTypes'

// ============================================================================
// 通用参数类型
// ============================================================================

/**
 * 评论参数
 */
export interface CommentParams {
  /** 作品ID */
  workId: string
  /** 评论内容 */
  content: string
  /** 回复的评论ID（可选，二级评论时使用） */
  replyToCommentId?: string
}

// ============================================================================
// 通用结果类型
// ============================================================================

/**
 * 基础结果
 */
export interface BaseResult {
  /** 是否成功 */
  success: boolean
  /** 错误/提示信息 */
  message?: string
  /** 原始响应数据 */
  rawData?: any
}

/**
 * 点赞结果
 */
export interface LikeResult extends BaseResult {}

/**
 * 评论结果
 */
export interface CommentResult extends BaseResult {
  /** 评论ID */
  commentId?: string
}

/**
 * 收藏结果
 */
export interface FavoriteResult extends BaseResult {}

/**
 * 私信参数
 */
export interface DirectMessageParams {
  /** 作品ID（二选一） */
  workId?: string
  /** 作者链接（二选一） */
  authorUrl?: string
  /** 私信内容 */
  content: string
}

/**
 * 私信结果
 */
export interface DirectMessageResult extends BaseResult {}

// ============================================================================
// 首页列表类型
// ============================================================================

/**
 * 话题信息
 */
export interface TopicInfo {
  /** 话题名称 */
  name: string
  /** 话题跳转链接 */
  url: string
}

/**
 * 首页作品列表项
 * 注：list不包含收藏数和话题，这些在详情中获取
 */
export interface HomeFeedItem {
  /** 作品ID */
  workId: string
  /** 缩略图URL */
  thumbnail: string
  /** 缩略图宽度 */
  thumbnailWidth?: number
  /** 缩略图高度 */
  thumbnailHeight?: number
  /** 作品标题 */
  title: string
  /** 作者头像 */
  authorAvatar: string
  /** 作者名称 */
  authorName: string
  /** 作者ID */
  authorId: string
  /** 作者主页链接 */
  authorUrl: string
  /** 点赞数（字符串，可能含"万"） */
  likeCount: string
  /** 是否已关注作者 */
  isFollowed: boolean
  /** 是否已点赞 */
  isLiked: boolean
  /** 是否为视频 */
  isVideo: boolean
  /** 视频时长（秒），非视频为 undefined */
  videoDuration?: number
  /** 平台原始数据 */
  origin: any
}

/**
 * 作品详情
 */
export interface WorkDetail {
  /** 作品ID */
  workId: string
  /** 作品类型：视频/图文 */
  type: 'video' | 'normal'
  /** 作品标题 */
  title: string
  /** 作品描述/正文 */
  description: string
  /** 封面图URL */
  coverUrl: string
  /** 图片列表（图文类型） */
  imageList: Array<{
    url: string
    width?: number
    height?: number
  }>
  /** 视频信息（视频类型） */
  video?: {
    /** 视频URL */
    url: string
    /** 时长（秒） */
    duration?: number
    /** 宽度 */
    width?: number
    /** 高度 */
    height?: number
  }
  /** 作者信息 */
  author: {
    id: string
    name: string
    avatar: string
    url: string
  }
  /** 互动数据 */
  interactInfo: {
    /** 点赞数 */
    likeCount: string
    /** 收藏数 */
    collectCount: string
    /** 评论数 */
    commentCount: string
    /** 分享数 */
    shareCount: string
    /** 是否已点赞 */
    isLiked: boolean
    /** 是否已收藏 */
    isCollected: boolean
    /** 是否已关注作者 */
    isFollowed: boolean
  }
  /** 话题列表 */
  topics: TopicInfo[]
  /** 发布时间（时间戳） */
  publishTime?: number
  /** IP位置 */
  ipLocation?: string
  /** 平台原始数据 */
  origin: any
}

/**
 * 获取作品详情请求参数
 */
export interface GetWorkDetailParams {
  /** 作品ID */
  workId: string
  /** 安全token（小红书需要） */
  xsecToken?: string
  /** 来源（小红书需要） */
  xsecSource?: string
  /** 列表项原始数据（抖音需要，直接从 HomeFeedItem.origin 获取详情） */
  origin?: any
}

/**
 * 获取作品详情返回结果
 */
export interface GetWorkDetailResult extends BaseResult {
  /** 作品详情 */
  detail?: WorkDetail
}

/**
 * 首页列表请求参数
 */
export interface HomeFeedListParams {
  /** 页码，从1开始 */
  page: number
  /** 每页数量 */
  size: number
}

/**
 * 首页列表返回结果
 */
export interface HomeFeedListResult extends BaseResult {
  /** 作品列表 */
  items: HomeFeedItem[]
  /** 是否有更多数据 */
  hasMore: boolean
  /** 总数（可选，部分平台不提供） */
  total?: number
}

// ============================================================================
// 平台接口定义
// ============================================================================

/**
 * 平台交互接口
 * 所有平台都需要实现此接口
 */
export interface IPlatformInteraction {
  /** 平台类型 */
  readonly platformType: PlatType

  /**
   * 点赞/取消点赞作品
   * @param workId 作品ID
   * @param isLike true 点赞，false 取消点赞
   */
  likeWork(workId: string, isLike: boolean): Promise<LikeResult>

  /**
   * 评论作品
   * @param params 评论参数
   */
  commentWork(params: CommentParams): Promise<CommentResult>

  /**
   * 收藏/取消收藏作品
   * @param workId 作品ID
   * @param isFavorite true 收藏，false 取消收藏
   */
  favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult>

  /**
   * 发送私信（可选方法，不是所有平台都支持）
   * @param params 私信参数
   */
  sendDirectMessage?(params: DirectMessageParams): Promise<DirectMessageResult>

  /**
   * 获取首页作品列表
   * @param params 分页参数
   */
  getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult>

  /**
   * 获取作品详情
   * @param params 作品详情请求参数
   */
  getWorkDetail(params: GetWorkDetailParams): Promise<GetWorkDetailResult>

  /**
   * 获取评论列表
   * @param params 评论列表请求参数
   */
  getCommentList(params: CommentListParams): Promise<CommentListResult>

  /**
   * 获取子评论列表（查看更多回复）
   * @param params 子评论列表请求参数
   */
  getSubCommentList(params: SubCommentListParams): Promise<CommentListResult>
}

// ============================================================================
// 支持的平台类型
// ============================================================================

/**
 * 支持交互功能的平台类型
 */
export type SupportedPlatformType = typeof PLUGIN_SUPPORTED_PLATFORMS[number]

// ============================================================================
// 评论列表相关类型
// ============================================================================

/**
 * 评论用户信息
 */
export interface CommentUser {
  /** 用户ID */
  id: string
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  avatar: string
  /** 安全token（小红书需要） */
  xsecToken?: string
}

/**
 * 统一评论项
 */
export interface CommentItem {
  /** 评论ID */
  id: string
  /** 评论内容 */
  content: string
  /** 创建时间（毫秒级时间戳） */
  createTime: number
  /** 点赞数 */
  likeCount: number
  /** 用户信息 */
  user: CommentUser
  /** IP属地 */
  ipLocation?: string
  /** 是否为作者 */
  isAuthor: boolean
  /** 是否已点赞 */
  isLiked: boolean
  /** 子评论/回复数量 */
  replyCount: number
  /** 子评论列表（首次加载时可能包含部分回复） */
  replies: CommentItem[]
  /** 子评论分页游标 */
  replyCursor?: string
  /** 是否有更多子评论 */
  hasMoreReplies: boolean
  /** 回复目标（二级评论时存在） */
  replyTo?: {
    /** 被回复的评论ID */
    id: string
    /** 被回复的用户信息 */
    user: CommentUser
  }
  /** 原始数据 */
  origin: unknown
}

/**
 * 评论列表请求参数
 */
export interface CommentListParams {
  /** 作品ID */
  workId: string
  /** 分页游标（首次请求不传或传空） */
  cursor?: string
  /** 每页数量 */
  count?: number
  /** 安全token（小红书需要） */
  xsecToken?: string
}

/**
 * 子评论列表请求参数
 */
export interface SubCommentListParams extends CommentListParams {
  /** 根评论ID */
  rootCommentId: string
}

/**
 * 评论列表返回结果
 */
export interface CommentListResult extends BaseResult {
  /** 评论列表 */
  comments: CommentItem[]
  /** 下一页游标 */
  cursor: string
  /** 是否有更多数据 */
  hasMore: boolean
  /** 评论总数（可选，部分平台不提供） */
  total?: number
}