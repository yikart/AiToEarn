/**
 * 小红书平台特定类型定义
 */

// ============================================================================
// 首页列表相关类型
// ============================================================================

/**
 * 小红书首页列表响应类型
 */
export interface XhsHomeFeedResponse {
  success: boolean
  code: number
  msg?: string
  data?: {
    items: XhsHomeFeedItem[]
    cursor_score: string
  }
}

/**
 * 小红书首页列表项原始类型
 */
export interface XhsHomeFeedItem {
  id: string
  model_type: string
  xsec_token: string
  note_card: {
    type: 'video' | 'normal'
    display_title: string
    cover: {
      url_default: string
      url_pre: string
      width: number
      height: number
    }
    user: {
      user_id: string
      nickname: string
      nick_name: string
      avatar: string
      xsec_token: string
    }
    interact_info: {
      liked: boolean
      liked_count: string
    }
    video?: {
      capa?: {
        duration: number
      }
    }
  }
}

// ============================================================================
// 通用响应类型
// ============================================================================

/**
 * 小红书通用 API 响应
 */
export interface XhsBaseResponse {
  success: boolean
  code: number
  msg?: string
}

/**
 * 小红书评论响应
 */
export interface XhsCommentResponse extends XhsBaseResponse {
  data?: {
    comment: {
      id: string
      [key: string]: any
    }
  }
}

