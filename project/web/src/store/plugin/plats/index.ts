/**
 * 平台工具统一导出
 */

// 小红书平台工具
export * as xhs from './xhs'
export type {
  XhsCommentParams,
  XhsCommentResult,
  XhsLikeResult,
  XhsFavoriteResult,
} from './xhs'

// 抖音平台工具
export * as douyin from './douyin'
export type {
  DouyinCommentParams,
  DouyinCommentResult,
  DouyinLikeResult,
  DouyinFavoriteResult,
} from './douyin'

