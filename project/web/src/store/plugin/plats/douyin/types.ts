/**
 * 抖音平台特定类型定义
 */

// ============================================================================
// 插件交互响应类型
// ============================================================================

/**
 * 抖音自动化操作响应
 */
export interface DouyinInteractionResponse {
  success: boolean
  message?: string
  error?: string
  data?: any
}

/**
 * 抖音私信响应
 */
export interface DouyinDirectMessageResponse {
  success: boolean
  message?: string
  error?: string
}

// ============================================================================
// 首页列表相关类型（待实现）
// ============================================================================

/**
 * 抖音首页列表响应类型
 * TODO: 待实现时补充具体字段
 */
export interface DouyinHomeFeedResponse {
  success: boolean
  code?: number
  msg?: string
  data?: {
    items: DouyinHomeFeedItem[]
    cursor?: string
    has_more?: boolean
  }
}

/**
 * 抖音首页列表项原始类型
 * TODO: 待实现时补充具体字段
 */
export interface DouyinHomeFeedItem {
  aweme_id: string
  desc: string
  author: {
    uid: string
    nickname: string
    avatar_thumb?: {
      url_list: string[]
    }
  }
  statistics?: {
    digg_count: number
    comment_count: number
    share_count: number
  }
  video?: {
    duration: number
    cover?: {
      url_list: string[]
    }
  }
}

