import type {
  CommentItem,
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
import { PlatType } from '@/app/config/platConfig'
import { ensurePluginBridge } from '../../bridge'

class KwaiPlatformInteraction implements IPlatformInteraction {
  readonly platformType = PlatType.KWAI

  private getPlugin() {
    const plugin = ensurePluginBridge()
    if (!plugin) {
      throw new Error('插件未安装或未就绪')
    }
    return plugin
  }

  async likeWork(): Promise<LikeResult> {
    return {
      success: false,
      message: '快手点赞触达功能已开放；当前等待快手页面执行器适配完成后执行。',
    }
  }

  async commentWork(_params: CommentParams): Promise<CommentResult> {
    return {
      success: false,
      message: '快手评论发布功能已开放；当前等待快手页面执行器适配完成后执行，发布前仍需人工确认。',
    }
  }

  async favoriteWork(): Promise<FavoriteResult> {
    return {
      success: false,
      message: '快手收藏触达功能已开放；当前等待快手页面执行器适配完成后执行。',
    }
  }

  async getHomeFeedList(_params: HomeFeedListParams): Promise<HomeFeedListResult> {
    return {
      success: false,
      message: '快手首页流 API 暂未接入。',
      items: [],
      hasMore: false,
    }
  }

  async getWorkDetail(_params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
    return {
      success: false,
      message: '快手作品详情 API 暂未接入。',
    }
  }

  async getCommentList(params: CommentListParams): Promise<CommentListResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'scanComments',
      count: params.count || 30,
      platform: 'kwai',
      workId: params.workId,
    })

    if (!response?.success) {
      return {
        success: false,
        message: response?.error || response?.message || '快手评论列表抓取失败，请确认作品页已打开且评论区可见',
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
          id: item.id || `kwai-comment-${Date.now()}-${index}`,
          ipLocation: item.ipLocation || '',
          isAuthor: false,
          isLiked: false,
          likeCount: Number(item.likeCount || 0),
          origin: item,
          replies: [],
          replyCount: 0,
          user: {
            avatar: item.user?.avatar || '',
            id: item.user?.id || `kwai-user-${index}`,
            nickname: item.user?.nickname || `快手用户${index + 1}`,
          },
        }))
      : []

    return {
      success: comments.length > 0,
      message: response.message || (comments.length > 0 ? `已从快手页面识别 ${comments.length} 条评论` : '快手页面未识别到评论'),
      comments,
      cursor: '',
      hasMore: false,
      rawData: response,
    }
  }

  async getSubCommentList(_params: SubCommentListParams): Promise<CommentListResult> {
    return {
      success: false,
      message: '快手二级评论暂未接入。',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }
}

export const kwaiInteraction = new KwaiPlatformInteraction()
