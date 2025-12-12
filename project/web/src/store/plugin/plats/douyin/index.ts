/**
 * 抖音平台交互实现
 *
 * 实现策略：
 * - 点赞、收藏、评论：统一使用自动化方案（避免 API 风控）
 * - 首页列表：使用 API 方案获取推荐作品
 * - 评论：不支持二级评论
 *
 * 目录结构:
 * douyin/
 *   ├── index.ts      # 主类和导出入口
 *   ├── types.ts      # 抖音特定类型定义
 *   └── homeFeed.ts   # 首页列表功能模块
 */

import { PlatType } from '@/app/config/platConfig'
import type {
  CommentParams,
  CommentResult,
  DirectMessageParams,
  DirectMessageResult,
  FavoriteResult,
  HomeFeedListParams,
  HomeFeedListResult,
  IPlatformInteraction,
  LikeResult,
} from '../types'
import type { DouyinDirectMessageResponse, DouyinInteractionResponse } from './types'
import { getHomeFeedList, homeFeedCursor } from './homeFeed'

/**
 * 抖音平台交互类
 */
class DouyinPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.Douyin

  /**
   * 检查插件是否可用
   */
  private checkPlugin(): void {
    if (!window.AIToEarnPlugin) {
      throw new Error('插件未安装或未就绪')
    }
  }

  /**
   * 重置首页列表游标缓存
   * 用于刷新列表时清除缓存
   */
  resetHomeFeedCursor(): void {
    homeFeedCursor.reset()
  }

  /**
   * 点赞/取消点赞作品（自动化方案）
   * 使用自动化方案避免 API 风控
   * @param workId 作品ID
   * @param isLike true=点赞，false=取消点赞
   */
  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    this.checkPlugin()

    const response = await window.AIToEarnPlugin!.douyinInteraction({
      action: 'like',
      workId,
      targetState: isLike,
    }) as DouyinInteractionResponse

    return {
      success: response.success,
      message: response.message || response.error,
      rawData: response,
    }
  }

  /**
   * 评论作品（自动化方案）
   * 使用自动化方案避免 API 风控
   * 注意：不支持二级评论
   * @param params 评论参数
   */
  async commentWork(params: CommentParams): Promise<CommentResult> {
    this.checkPlugin()

    // 不支持二级评论
    if (params.replyToCommentId) {
      return {
        success: false,
        message: '抖音评论暂不支持二级评论',
      }
    }

    const response = await window.AIToEarnPlugin!.douyinInteraction({
      action: 'comment',
      workId: params.workId,
      targetState: true,
      content: params.content,
    }) as DouyinInteractionResponse

    return {
      success: response.success,
      message: response.message || response.error,
      rawData: response,
    }
  }

  /**
   * 收藏/取消收藏作品（自动化方案）
   * 使用自动化方案避免 API 风控
   * @param workId 作品ID
   * @param isFavorite true=收藏，false=取消收藏
   */
  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    this.checkPlugin()

    const response = await window.AIToEarnPlugin!.douyinInteraction({
      action: 'favorite',
      workId,
      targetState: isFavorite,
    }) as DouyinInteractionResponse

    return {
      success: response.success,
      message: response.message || response.error,
      rawData: response,
    }
  }

  /**
   * 发送私信（自动化方案）
   * 根据作品ID或作者链接发送私信
   * @param params 私信参数
   */
  async sendDirectMessage(params: DirectMessageParams): Promise<DirectMessageResult> {
    this.checkPlugin()

    // 验证参数
    if (!params.workId && !params.authorUrl) {
      return {
        success: false,
        message: '必须提供作品ID或作者链接',
      }
    }

    if (!params.content) {
      return {
        success: false,
        message: '私信内容不能为空',
      }
    }

    const response = await window.AIToEarnPlugin!.douyinDirectMessage({
      workId: params.workId,
      authorUrl: params.authorUrl,
      content: params.content,
    }) as DouyinDirectMessageResponse

    return {
      success: response.success,
      message: response.message || response.error,
      rawData: response,
    }
  }

  /**
   * 获取首页作品列表
   * @param params 分页参数
   */
  async getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
    return getHomeFeedList(params)
  }
}

/**
 * 抖音平台交互实例
 */
export const douyinInteraction = new DouyinPlatformInteraction()

// 导出类型（方便外部使用）
export type { DouyinHomeFeedItem, DouyinHomeFeedResponse } from './types'
