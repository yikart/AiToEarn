/**
 * 平台交互统一类型定义
 * 所有平台共用的类型接口
 */

import { PlatType } from '@/app/config/platConfig'

/**
 * 评论参数（通用）
 */
export interface CommentParams {
  /** 作品ID */
  workId: string
  /** 评论内容 */
  content: string
  /** 回复的评论ID（可选，如果是回复评论） */
  replyToCommentId?: string
}

/**
 * 评论结果（通用）
 */
export interface CommentResult {
  /** 是否成功 */
  success: boolean
  /** 评论ID */
  commentId?: string
  /** 错误信息 */
  message?: string
  /** 原始响应数据 */
  rawData?: any
}

/**
 * 点赞结果（通用）
 */
export interface LikeResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  message?: string
  /** 原始响应数据 */
  rawData?: any
}

/**
 * 收藏结果（通用）
 */
export interface FavoriteResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  message?: string
  /** 原始响应数据 */
  rawData?: any
}

/**
 * 平台交互接口
 * 所有平台都需要实现这些方法
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

/**
 * 支持的平台类型（交互功能）
 */
export type SupportedPlatformType = PlatType.Xhs | PlatType.Douyin

