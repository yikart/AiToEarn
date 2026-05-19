/**
 * 小红书平台交互实现
 *
 * 目录结构:
 * xhs/
 *   ├── index.ts      # 主类和导出入口
 *   ├── types.ts      # 小红书特定类型定义
 *   └── homeFeed.ts   # 首页列表功能模块
 */

import type {
  CommentListParams,
  CommentListResult,
  CommentParams,
  CommentResult,
  FavoriteResult,
  GetWorkDetailParams,
  GetWorkDetailResult,
  HomeFeedListParams,
  HomeFeedListResult,
  IPlatformInteraction,
  LikeResult,
  SubCommentListParams,
} from '../types'
import type { XhsBaseResponse, XhsCommentResponse } from './types'
import { PlatType } from '@/app/config/platConfig'
import { getCommentList, getSubCommentList } from './comment'
import { getHomeFeedList, homeFeedCursor } from './homeFeed'

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
   * 重置首页列表游标缓存
   * 用于刷新列表时清除缓存
   */
  resetHomeFeedCursor(): void {
    homeFeedCursor.reset()
  }

  /**
   * 点赞/取消点赞作品
   */
  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    this.checkPlugin()

    if (window.AIToEarnPlugin!.unifiedInteraction) {
      const response = await window.AIToEarnPlugin!.unifiedInteraction({
        platform: 'xhs',
        action: 'like',
        workLink: `https://www.xiaohongshu.com/explore/${workId}`,
        targetState: isLike,
        needScreenshot: true,
      })
      return {
        success: response.success,
        message: response.message || response.error,
        screenshot: response.screenshot,
        rawData: response,
      }
    }

    const path = isLike ? '/api/sns/web/v1/note/like' : '/api/sns/web/v1/note/dislike'

    const response = await window.AIToEarnPlugin!.xhsRequest<XhsBaseResponse>({
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
   * 一级评论使用自动化方案；二级评论保留 API 方案
   */
  async commentWork(params: CommentParams): Promise<CommentResult> {
    this.checkPlugin()

    // 一级评论使用 unifiedInteraction（自动化）
    if (!params.replyToCommentId && window.AIToEarnPlugin!.unifiedInteraction) {
      const response = await window.AIToEarnPlugin!.unifiedInteraction({
        platform: 'xhs',
        action: 'comment',
        workLink: `https://www.xiaohongshu.com/explore/${params.workId}`,
        targetState: true,
        content: params.content,
        needScreenshot: true,
      })
      return {
        success: response.success,
        message: response.message || response.error,
        screenshot: response.screenshot,
        rawData: response,
      }
    }

    // 二级评论或老插件回退到 API 方案
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

    const response = await window.AIToEarnPlugin!.xhsRequest<XhsCommentResponse>({
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

    if (window.AIToEarnPlugin!.unifiedInteraction) {
      const response = await window.AIToEarnPlugin!.unifiedInteraction({
        platform: 'xhs',
        action: 'favorite',
        workLink: `https://www.xiaohongshu.com/explore/${workId}`,
        targetState: isFavorite,
        needScreenshot: true,
      })
      return {
        success: response.success,
        message: response.message || response.error,
        screenshot: response.screenshot,
        rawData: response,
      }
    }

    const path = isFavorite ? '/api/sns/web/v1/note/collect' : '/api/sns/web/v1/note/uncollect'

    const data = isFavorite ? { note_id: workId } : { note_ids: workId }

    const response = await window.AIToEarnPlugin!.xhsRequest<XhsBaseResponse>({
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

  /**
   * 获取首页作品列表
   * @param params 分页参数
   */
  async getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
    return getHomeFeedList(params)
  }

  /**
   * 获取作品详情
   * @param params 详情请求参数
   */
  async getWorkDetail(_params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
    return {
      success: false,
      message: '小红书作品详情抓取能力已移除',
    }
  }

  /**
   * 获取评论列表
   * @param params 评论列表请求参数
   */
  async getCommentList(params: CommentListParams): Promise<CommentListResult> {
    return getCommentList(params)
  }

  /**
   * 获取子评论列表（查看更多回复）
   * @param params 子评论列表请求参数
   */
  async getSubCommentList(params: SubCommentListParams): Promise<CommentListResult> {
    return getSubCommentList(params)
  }
}

/**
 * 小红书平台交互实例
 */
export const xhsInteraction = new XhsPlatformInteraction()

// 导出类型（方便外部使用）
export type {
  XhsCommentItem,
  XhsCommentListResponse,
  XhsCommentUserInfo,
  XhsHomeFeedItem,
  XhsHomeFeedResponse,
  XhsSubCommentItem,
  XhsSubCommentListResponse,
} from './types'
