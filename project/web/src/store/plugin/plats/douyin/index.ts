/**
 * 抖音平台交互实现
 *
 * 实现策略：
 * - 点赞、收藏：使用自动化方案（避免 API 风控）
 * - 评论：使用 API 方案
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
   * 评论作品（API 方案）
   * 评论使用 API 方案，风控相对较低
   */
  async commentWork(params: CommentParams): Promise<CommentResult> {
    this.checkPlugin()

    const data: {
      aweme_id: string
      text: string
      reply_id?: string
    } = {
      aweme_id: params.workId,
      text: params.content,
    }

    if (params.replyToCommentId) {
      data.reply_id = params.replyToCommentId
    }

    const response = await window.AIToEarnPlugin!.douyinRequest<{
      status_code: number
      status_msg?: string
      comment?: {
        cid: string
        [key: string]: any
      }
    }>({
      path: '/web/api/media/aweme/comment/post/',
      method: 'POST',
      data,
    })

    return {
      success: response.status_code === 0,
      commentId: response.comment?.cid,
      message: response.status_msg,
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
