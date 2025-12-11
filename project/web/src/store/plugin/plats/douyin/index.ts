/**
 * 抖音平台交互实现
 *
 * 实现策略：
 * - 点赞、收藏、评论：统一使用自动化方案（避免 API 风控）
 * - 评论：不支持二级评论
 */

import { PlatType } from '@/app/config/platConfig'
import type {
  CommentParams,
  CommentResult,
  FavoriteResult,
  IPlatformInteraction,
  LikeResult,
} from '../types'

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
    })

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
    })

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
    })

    return {
      success: response.success,
      message: response.message || response.error,
      rawData: response,
    }
  }
}

/**
 * 抖音平台交互实例
 */
export const douyinInteraction = new DouyinPlatformInteraction()
