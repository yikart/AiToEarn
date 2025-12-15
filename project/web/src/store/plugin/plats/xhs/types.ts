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
      /** 是否已点赞 */
      liked: boolean
      /** 点赞数 */
      liked_count: string
      /** 是否已收藏 */
      collected?: boolean
      /** 是否已关注 */
      followed?: boolean
    }
    /** 话题标签列表 */
    tag_list?: Array<{
      id: string
      name: string
      type: string
    }>
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
 * 小红书评论响应（发布评论）
 */
export interface XhsCommentResponse extends XhsBaseResponse {
  data?: {
    comment: {
      id: string
      [key: string]: unknown
    }
  }
}

// ============================================================================
// 评论列表相关类型
// ============================================================================

/**
 * 小红书评论用户信息
 */
export interface XhsCommentUserInfo {
  /** 用户ID */
  user_id: string
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  image: string
  /** 安全token */
  xsec_token: string
}

/**
 * 小红书评论项（一级评论）
 */
export interface XhsCommentItem {
  /** 评论ID */
  id: string
  /** 笔记ID */
  note_id: string
  /** 评论内容 */
  content: string
  /** 创建时间（毫秒级时间戳） */
  create_time: number
  /** 点赞数（字符串） */
  like_count: string
  /** 用户信息 */
  user_info: XhsCommentUserInfo
  /** IP属地 */
  ip_location?: string
  /** 状态 */
  status: number
  /** @提到的用户列表 */
  at_users: Array<{
    user_id: string
    nickname: string
  }>
  /** 是否已点赞 */
  liked: boolean
  /** 标签（如 is_author 表示作者） */
  show_tags: string[]
  /** 子评论数量（字符串） */
  sub_comment_count: string
  /** 子评论列表 */
  sub_comments: XhsSubCommentItem[]
  /** 子评论分页游标 */
  sub_comment_cursor: string
  /** 是否有更多子评论 */
  sub_comment_has_more: boolean
}

/**
 * 小红书子评论项（二级评论）
 */
export interface XhsSubCommentItem {
  /** 评论ID */
  id: string
  /** 笔记ID */
  note_id: string
  /** 评论内容 */
  content: string
  /** 创建时间（毫秒级时间戳） */
  create_time: number
  /** 点赞数（字符串） */
  like_count: string
  /** 用户信息 */
  user_info: XhsCommentUserInfo
  /** IP属地 */
  ip_location?: string
  /** 状态 */
  status: number
  /** @提到的用户列表 */
  at_users: Array<{
    user_id: string
    nickname: string
  }>
  /** 是否已点赞 */
  liked: boolean
  /** 标签（如 is_author 表示作者） */
  show_tags: string[]
  /** 回复目标评论 */
  target_comment?: {
    id: string
    user_info: XhsCommentUserInfo
  }
}

/**
 * 小红书评论列表响应
 */
export interface XhsCommentListResponse extends XhsBaseResponse {
  data?: {
    /** 评论列表 */
    comments: XhsCommentItem[]
    /** 下一页游标 */
    cursor: string
    /** 是否有更多 */
    has_more: boolean
    /** 时间戳 */
    time: number
    /** 当前用户ID */
    user_id: string
    /** 安全token */
    xsec_token: string
  }
}

/**
 * 小红书子评论列表响应
 */
export interface XhsSubCommentListResponse extends XhsBaseResponse {
  data?: {
    /** 子评论列表 */
    comments: XhsSubCommentItem[]
    /** 下一页游标 */
    cursor: string
    /** 是否有更多 */
    has_more: boolean
    /** 时间戳 */
    time: number
    /** 当前用户ID */
    user_id: string
    /** 安全token */
    xsec_token: string
  }
}

