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

import type {
  CommentListParams,
  CommentListResult,
  CommentItem,
  CommentParams,
  CommentResult,
  DirectMessageParams,
  DirectMessageResult,
  FavoriteResult,
  GetWorkDetailParams,
  GetWorkDetailResult,
  HomeFeedListParams,
  HomeFeedListResult,
  IPlatformInteraction,
  LikeResult,
  SubCommentListParams,
} from '../types'
import type { DouyinDirectMessageResponse, DouyinInteractionResponse } from './types'
import { PlatType } from '@/app/config/platConfig'
import { ensurePluginBridge } from '../../bridge'
import { getHomeFeedList, homeFeedCursor } from './homeFeed'
import { getWorkDetail, getWorkDetailFromListItem } from './workDetail'

/**
 * 抖音平台交互类
 */
class DouyinPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.Douyin

  /**
   * 检查插件是否可用
   */
  private getPlugin() {
    const plugin = ensurePluginBridge()
    if (!plugin) {
      throw new Error('插件未安装或未就绪')
    }
    return plugin
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
    const plugin = this.getPlugin()

    const response = (await plugin.douyinInteraction({
      action: 'like',
      workId,
      targetState: isLike,
    })) as DouyinInteractionResponse

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
    const plugin = this.getPlugin()

    // 不支持二级评论
    if (params.replyToCommentId) {
      return {
        success: false,
        message: '抖音评论暂不支持二级评论',
      }
    }

    const response = (await plugin.douyinInteraction({
      action: 'comment',
      workId: params.workId,
      targetState: true,
      content: params.content,
    })) as DouyinInteractionResponse

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
    const plugin = this.getPlugin()

    const response = (await plugin.douyinInteraction({
      action: 'favorite',
      workId,
      targetState: isFavorite,
    })) as DouyinInteractionResponse

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
    const plugin = this.getPlugin()

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

    const response = (await plugin.douyinDirectMessage({
      workId: params.workId,
      authorUrl: params.authorUrl,
      content: params.content,
    })) as DouyinDirectMessageResponse

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

  /**
   * 获取作品详情
   * 抖音直接从list的item数据获取详情，不需要额外请求API
   * @param params 详情请求参数
   */
  async getWorkDetail(params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
    return getWorkDetail(params)
  }

  /**
   * 从列表项获取作品详情
   * 这是抖音特有的方法，直接从 HomeFeedItem.origin 获取详情
   * @param listItemOrigin HomeFeedItem.origin 原始数据
   */
  getWorkDetailFromListItem(listItemOrigin: unknown): GetWorkDetailResult {
    return getWorkDetailFromListItem(listItemOrigin)
  }

  /**
   * 获取评论列表
   * TODO: 待实现抖音评论列表功能
   * @param params 评论列表请求参数
   */
  async getCommentList(params: CommentListParams): Promise<CommentListResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'scanComments',
      count: params.count || 30,
      platform: 'douyin',
      workId: params.workId,
    })

    if (!response?.success) {
      return {
        success: false,
        message: response?.error || response?.message || '抖音评论列表抓取失败，请确认作品页已打开且评论区可见',
        comments: [],
        cursor: '',
        hasMore: false,
        rawData: response,
      }
    }

    const comments = Array.isArray(response.comments)
      ? response.comments.map((item: any, index: number): CommentItem => ({
          content: item.content || '',
          createTime: Number(item.createTime || Date.now()),
          hasMoreReplies: false,
          id: item.id || `douyin-comment-${Date.now()}-${index}`,
          ipLocation: item.ipLocation || '',
          isAuthor: false,
          isLiked: false,
          likeCount: Number(item.likeCount || 0),
          origin: item,
          replies: [],
          replyCount: 0,
          user: {
            avatar: item.user?.avatar || '',
            id: item.user?.id || `douyin-user-${index}`,
            nickname: item.user?.nickname || `抖音用户${index + 1}`,
          },
        }))
      : []

    return {
      success: comments.length > 0,
      message: response.message || (comments.length > 0 ? `已从抖音页面识别 ${comments.length} 条评论` : '抖音页面未识别到评论'),
      comments,
      cursor: '',
      hasMore: false,
      rawData: response,
    }
  }

  /**
   * 获取子评论列表（查看更多回复）
   * TODO: 待实现抖音子评论列表功能
   * @param params 子评论列表请求参数
   */
  async getSubCommentList(params: SubCommentListParams): Promise<CommentListResult> {
    // TODO: 实现抖音子评论列表
    return {
      success: false,
      message: '抖音子评论列表功能开发中',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }
}

/**
 * 抖音平台交互实例
 */
export const douyinInteraction = new DouyinPlatformInteraction()

// 导出类型（方便外部使用）
export type { DouyinHomeFeedItem, DouyinHomeFeedResponse } from './types'

// 导出工具方法
export { getWorkDetailFromListItem } from './workDetail'
