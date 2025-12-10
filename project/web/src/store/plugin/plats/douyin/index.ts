/**
 * 抖音平台交互实现
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
   * 点赞/取消点赞作品
   */
  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    this.checkPlugin()

    const response = await window.AIToEarnPlugin!.douyinRequest<{
      status_code: number
      status_msg?: string
    }>({
      path: '/web/api/media/aweme/favorite/',
      method: 'POST',
      data: {
        aweme_id: workId,
        action: isLike ? 1 : 0,
      },
    })

    return {
      success: response.status_code === 0,
      message: response.status_msg,
      rawData: response,
    }
  }

  /**
   * 评论作品
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
   * 收藏/取消收藏作品
   */
  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    this.checkPlugin()

    const response = await window.AIToEarnPlugin!.douyinRequest<{
      status_code: number
      status_msg?: string
    }>({
      path: '/web/api/media/aweme/collect/',
      method: 'POST',
      data: {
        aweme_id: workId,
        action: isFavorite ? 1 : 0,
      },
    })

    return {
      success: response.status_code === 0,
      message: response.status_msg,
      rawData: response,
    }
  }
}

/**
 * 抖音平台交互实例
 */
export const douyinInteraction = new DouyinPlatformInteraction()

