/**
 * 小红书平台交互实现
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
 * 小红书平台交互类
 */
class XhsPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.Xhs

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

    const path = isLike
      ? '/api/sns/web/v1/note/like'
      : '/api/sns/web/v1/note/dislike'

    const response = await window.AIToEarnPlugin!.xhsRequest<{
      success: boolean
      code: number
      msg?: string
    }>({
      path,
      method: 'POST',
      data: { note_oid: workId },
    })

    return {
      success: response.success,
      message: response.msg,
      rawData: response,
    }
  }

  /**
   * 评论作品
   */
  async commentWork(params: CommentParams): Promise<CommentResult> {
    this.checkPlugin()

    const data: {
      note_id: string
      content: string
      at_users: Array<{ user_id: string, nickname: string }>
      target_comment_id?: string
    } = {
      note_id: params.workId,
      content: params.content,
      at_users: [],
    }

    if (params.replyToCommentId) {
      data.target_comment_id = params.replyToCommentId
    }

    const response = await window.AIToEarnPlugin!.xhsRequest<{
      success: boolean
      code: number
      msg?: string
      data?: {
        comment: {
          id: string
          [key: string]: any
        }
      }
    }>({
      path: '/api/sns/web/v1/comment/post',
      method: 'POST',
      data,
    })

    return {
      success: response.success,
      commentId: response.data?.comment?.id,
      message: response.msg,
      rawData: response,
    }
  }

  /**
   * 收藏/取消收藏作品
   */
  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    this.checkPlugin()

    const path = isFavorite
      ? '/api/sns/web/v1/note/collect'
      : '/api/sns/web/v1/note/uncollect'

    const data = isFavorite
      ? { note_id: workId }
      : { note_ids: workId }

    const response = await window.AIToEarnPlugin!.xhsRequest<{
      success: boolean
      code: number
      msg?: string
    }>({
      path,
      method: 'POST',
      data,
    })

    return {
      success: response.success,
      message: response.msg,
      rawData: response,
    }
  }
}

/**
 * 小红书平台交互实例
 */
export const xhsInteraction = new XhsPlatformInteraction()

