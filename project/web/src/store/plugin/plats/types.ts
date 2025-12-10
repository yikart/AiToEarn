/**
 * 平台交互统一类型定义
 */

import { PlatType } from '@/app/config/platConfig'

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
}

// ============================================================================
// 支持的平台类型
// ============================================================================

/**
 * 支持交互功能的平台类型
 */
export type SupportedPlatformType = PlatType.Xhs | PlatType.Douyin
