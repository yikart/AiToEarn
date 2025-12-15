/**
 * 平台交互管理器
 * 统一管理所有平台的交互操作
 */

import { PlatType } from '@/app/config/platConfig'
import type {
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
  SupportedPlatformType,
} from './types'
import { xhsInteraction } from './xhs'
import { douyinInteraction } from './douyin'

/**
 * 平台交互管理器
 */
class PlatformInteractionManager {
  private platforms = new Map<SupportedPlatformType, IPlatformInteraction>()

  constructor() {
    this.register(xhsInteraction)
    this.register(douyinInteraction)
  }

  /**
   * 注册平台
   */
  register(platform: IPlatformInteraction): void {
    this.platforms.set(platform.platformType as SupportedPlatformType, platform)
  }

  /**
   * 获取平台实例
   */
  get(platform: SupportedPlatformType): IPlatformInteraction {
    const instance = this.platforms.get(platform)
    if (!instance) {
      throw new Error(`不支持的平台: ${platform}`)
    }
    return instance
  }

  /**
   * 检查是否支持该平台
   */
  isSupported(platform: PlatType): platform is SupportedPlatformType {
    return this.platforms.has(platform as SupportedPlatformType)
  }

  /**
   * 获取所有支持的平台
   */
  getSupportedPlatforms(): SupportedPlatformType[] {
    return Array.from(this.platforms.keys())
  }

  /**
   * 点赞/取消点赞
   */
  likeWork(
    platform: SupportedPlatformType,
    workId: string,
    isLike: boolean,
  ): Promise<LikeResult> {
    return this.get(platform).likeWork(workId, isLike)
  }

  /**
   * 评论作品
   */
  commentWork(
    platform: SupportedPlatformType,
    params: CommentParams,
  ): Promise<CommentResult> {
    return this.get(platform).commentWork(params)
  }

  /**
   * 收藏/取消收藏
   */
  favoriteWork(
    platform: SupportedPlatformType,
    workId: string,
    isFavorite: boolean,
  ): Promise<FavoriteResult> {
    return this.get(platform).favoriteWork(workId, isFavorite)
  }

  /**
   * 检查平台是否支持私信功能
   */
  supportsDirectMessage(platform: SupportedPlatformType): boolean {
    const instance = this.get(platform)
    return typeof instance.sendDirectMessage === 'function'
  }

  /**
   * 发送私信
   * 注意：只有抖音支持私信，小红书不支持
   */
  async sendDirectMessage(
    platform: SupportedPlatformType,
    params: DirectMessageParams,
  ): Promise<DirectMessageResult> {
    const instance = this.get(platform)
    if (!instance.sendDirectMessage) {
      return {
        success: false,
        message: `${platform} 平台不支持私信功能`,
      }
    }
    return instance.sendDirectMessage(params)
  }

  /**
   * 获取首页作品列表
   * @param platform 平台类型
   * @param params 分页参数
   */
  getHomeFeedList(
    platform: SupportedPlatformType,
    params: HomeFeedListParams,
  ): Promise<HomeFeedListResult> {
    return this.get(platform).getHomeFeedList(params)
  }

  /**
   * 获取作品详情
   * @param platform 平台类型
   * @param params 详情请求参数
   */
  getWorkDetail(
    platform: SupportedPlatformType,
    params: GetWorkDetailParams,
  ): Promise<GetWorkDetailResult> {
    return this.get(platform).getWorkDetail(params)
  }

  /**
   * 获取评论列表
   * @param platform 平台类型
   * @param params 评论列表请求参数
   */
  getCommentList(
    platform: SupportedPlatformType,
    params: CommentListParams,
  ): Promise<CommentListResult> {
    return this.get(platform).getCommentList(params)
  }

  /**
   * 获取子评论列表（查看更多回复）
   * @param platform 平台类型
   * @param params 子评论列表请求参数
   */
  getSubCommentList(
    platform: SupportedPlatformType,
    params: SubCommentListParams,
  ): Promise<CommentListResult> {
    return this.get(platform).getSubCommentList(params)
  }
}

/**
 * 管理器实例
 */
export const platformManager = new PlatformInteractionManager()
