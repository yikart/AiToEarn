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
// 首页列表相关类型
// ============================================================================

/**
 * 抖音首页列表 API 响应类型
 * 注意：抖音 API 返回字段极多，这里只定义关键字段
 * 实际使用时建议通过 any 类型访问原始数据
 */
export interface DouyinHomeFeedResponse {
  /** 状态码，0 表示成功 */
  status_code: number
  /** 状态信息 */
  status_msg?: string
  /** 是否有更多数据，1 表示有 */
  has_more: number
  /** 作品列表 */
  aweme_list: DouyinHomeFeedItem[]
}

/**
 * 抖音首页列表项原始类型
 * 注意：实际字段远比这里定义的多，这里只列出核心字段
 */
export interface DouyinHomeFeedItem {
  /** 作品 ID */
  aweme_id: string
  /** 作品描述 */
  desc: string
  /** 预览标题 */
  preview_title?: string
  /** 创建时间戳 */
  create_time?: number
  /** 作者信息 */
  author: {
    uid: string
    sec_uid?: string
    nickname: string
    avatar_thumb?: {
      url_list: string[]
    }
    avatar_medium?: {
      url_list: string[]
    }
  }
  /** 统计信息 */
  statistics?: {
    digg_count: number
    comment_count: number
    share_count: number
    collect_count?: number
    play_count?: number
  }
  /** 视频信息 */
  video?: {
    /** 视频时长（毫秒） */
    duration: number
    /** 视频封面 */
    cover?: {
      url_list: string[]
    }
    /** 原始封面 */
    origin_cover?: {
      url_list: string[]
    }
    width?: number
    height?: number
  }
}

