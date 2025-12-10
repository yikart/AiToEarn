/**
 * 平台交互管理器
 * 统一管理所有平台的交互操作
 */

import { PlatType } from '@/app/config/platConfig'
import type {
  CommentParams,
  CommentResult,
  FavoriteResult,
  IPlatformInteraction,
  LikeResult,
  SupportedPlatformType,
} from './types'
import { xhsInteraction } from './xhs'
import { douyinInteraction } from './douyin'

/**
 * 平台交互管理器
 * 提供统一的接口来调用不同平台的交互功能
 */
class PlatformInteractionManager {
  /** 平台实例映射 */
  private platforms: Map<SupportedPlatformType, IPlatformInteraction>

  constructor() {
    this.platforms = new Map()
    // 注册平台
    this.platforms.set(PlatType.Xhs, xhsInteraction)
    this.platforms.set(PlatType.Douyin, douyinInteraction)
  }

  /**
   * 获取平台交互实例
   * @param platform 平台类型
   */
  getPlatform(platform: SupportedPlatformType): IPlatformInteraction {
    const instance = this.platforms.get(platform)
    if (!instance) {
      throw new Error(`不支持的平台: ${platform}`)
    }
    return instance
  }

  /**
   * 检查平台是否支持
   * @param platform 平台类型
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
   * 点赞/取消点赞作品
   * @param platform 平台类型
   * @param workId 作品ID
   * @param isLike true 点赞，false 取消点赞
   */
  async likeWork(
    platform: SupportedPlatformType,
    workId: string,
    isLike: boolean,
  ): Promise<LikeResult> {
    return this.getPlatform(platform).likeWork(workId, isLike)
  }

  /**
   * 评论作品
   * @param platform 平台类型
   * @param params 评论参数
   */
  async commentWork(
    platform: SupportedPlatformType,
    params: CommentParams,
  ): Promise<CommentResult> {
    return this.getPlatform(platform).commentWork(params)
  }

  /**
   * 收藏/取消收藏作品
   * @param platform 平台类型
   * @param workId 作品ID
   * @param isFavorite true 收藏，false 取消收藏
   */
  async favoriteWork(
    platform: SupportedPlatformType,
    workId: string,
    isFavorite: boolean,
  ): Promise<FavoriteResult> {
    return this.getPlatform(platform).favoriteWork(workId, isFavorite)
  }
}

/**
 * 平台交互管理器实例（单例）
 */
export const platformManager = new PlatformInteractionManager()

