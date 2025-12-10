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
}

/**
 * 管理器实例
 */
export const platformManager = new PlatformInteractionManager()
