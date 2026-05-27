import type {
  CommentItem,
  CommentListParams,
  CommentListResult,
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
import { PlatType } from '@/app/config/platConfig'
import { ensurePluginBridge } from '../../bridge'

const pluginPlatformKey: Partial<Record<PlatType, string>> = {
  [PlatType.BILIBILI]: 'bilibili',
  [PlatType.Douyin]: 'douyin',
  [PlatType.Facebook]: 'facebook',
  [PlatType.Instagram]: 'instagram',
  [PlatType.KWAI]: 'kwai',
  [PlatType.LinkedIn]: 'linkedin',
  [PlatType.Pinterest]: 'pinterest',
  [PlatType.Threads]: 'threads',
  [PlatType.Tiktok]: 'tiktok',
  [PlatType.Twitter]: 'twitter',
  [PlatType.WxGzh]: 'wxGzh',
  [PlatType.WxSph]: 'wxSph',
  [PlatType.Xhs]: 'xhs',
  [PlatType.YouTube]: 'youtube',
}

const platformNames: Partial<Record<PlatType, string>> = {
  [PlatType.BILIBILI]: 'B站',
  [PlatType.Douyin]: '抖音',
  [PlatType.Facebook]: 'Facebook',
  [PlatType.Instagram]: 'Instagram',
  [PlatType.KWAI]: '快手',
  [PlatType.LinkedIn]: 'LinkedIn',
  [PlatType.Pinterest]: 'Pinterest',
  [PlatType.Threads]: 'Threads',
  [PlatType.Tiktok]: 'TikTok',
  [PlatType.Twitter]: 'Twitter / X',
  [PlatType.WxGzh]: '微信公众号',
  [PlatType.WxSph]: '视频号',
  [PlatType.Xhs]: '小红书',
  [PlatType.YouTube]: 'YouTube',
}

function toCommentItem(item: any, platform: PlatType, index: number): CommentItem {
  const key = pluginPlatformKey[platform] || platform

  return {
    content: item?.content || '',
    createTime: Number(item?.createTime || Date.now()),
    hasMoreReplies: false,
    id: item?.id || `${key}-comment-${Date.now()}-${index}`,
    ipLocation: item?.ipLocation || '',
    isAuthor: false,
    isLiked: false,
    likeCount: Number(item?.likeCount || 0),
    origin: item,
    replies: [],
    replyCount: 0,
    user: {
      avatar: item?.user?.avatar || '',
      id: item?.user?.id || `${key}-user-${index}`,
      nickname: item?.user?.nickname || `${platformNames[platform] || '平台'}用户${index + 1}`,
    },
  }
}

export class GenericRadarPlatformInteraction implements IPlatformInteraction {
  readonly platformType: PlatType

  constructor(platformType: PlatType) {
    this.platformType = platformType
  }

  private get platformKey() {
    return pluginPlatformKey[this.platformType] || this.platformType
  }

  private get platformName() {
    return platformNames[this.platformType] || this.platformKey
  }

  private getPlugin() {
    const plugin = ensurePluginBridge()
    if (!plugin) {
      throw new Error('插件未安装或未就绪')
    }
    return plugin
  }

  async likeWork(workId: string, isLike: boolean): Promise<LikeResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'like',
      platform: this.platformKey,
      targetState: isLike,
      workId,
    })

    return {
      success: Boolean(response?.success),
      message: response?.message || response?.error || `${this.platformName}点赞动作未完成`,
      rawData: response,
    }
  }

  async commentWork(params: CommentParams): Promise<CommentResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'comment',
      content: params.content,
      platform: this.platformKey,
      replyToCommentId: params.replyToCommentId,
      workId: params.workId,
    })

    return {
      commentId: response?.commentId,
      success: Boolean(response?.success),
      message: response?.message || response?.error || `${this.platformName}评论动作未完成`,
      rawData: response,
    }
  }

  async favoriteWork(workId: string, isFavorite: boolean): Promise<FavoriteResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'favorite',
      platform: this.platformKey,
      targetState: isFavorite,
      workId,
    })

    return {
      success: Boolean(response?.success),
      message: response?.message || response?.error || `${this.platformName}收藏动作未完成`,
      rawData: response,
    }
  }

  async sendDirectMessage(params: DirectMessageParams): Promise<DirectMessageResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'directMessage',
      authorUrl: params.authorUrl,
      content: params.content,
      platform: this.platformKey,
      workId: params.workId,
    })

    return {
      success: Boolean(response?.success),
      message: response?.message || response?.error || `${this.platformName}私信动作未完成`,
      rawData: response,
    }
  }

  async getHomeFeedList(_params: HomeFeedListParams): Promise<HomeFeedListResult> {
    return {
      success: false,
      message: `${this.platformName}首页流 API 暂未接入，雷达请先使用关键词扫描。`,
      items: [],
      hasMore: false,
    }
  }

  async getWorkDetail(_params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
    return {
      success: false,
      message: `${this.platformName}作品详情 API 暂未接入，雷达会从可见页面内容提取线索。`,
    }
  }

  async getCommentList(params: CommentListParams): Promise<CommentListResult> {
    const plugin = this.getPlugin()
    const response = await plugin.unifiedInteraction?.({
      action: 'scanComments',
      count: params.count || 30,
      platform: this.platformKey,
      workId: params.workId,
    })

    const comments = Array.isArray(response?.comments)
      ? response.comments.map((item: any, index: number) => toCommentItem(item, this.platformType, index))
      : []

    return {
      success: Boolean(response?.success) && comments.length > 0,
      message: response?.message || response?.error || (comments.length > 0
        ? `已从${this.platformName}页面识别 ${comments.length} 条评论`
        : `${this.platformName}页面未识别到评论`),
      comments,
      cursor: '',
      hasMore: false,
      rawData: response,
    }
  }

  async getSubCommentList(_params: SubCommentListParams): Promise<CommentListResult> {
    return {
      success: false,
      message: `${this.platformName}二级评论暂未接入。`,
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }
}

export function createGenericRadarInteraction(platform: PlatType) {
  return new GenericRadarPlatformInteraction(platform)
}
