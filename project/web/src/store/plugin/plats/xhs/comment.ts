/**
 * 小红书评论功能模块
 */

import type {
  CommentItem,
  CommentListParams,
  CommentListResult,
  CommentUser,
  SubCommentListParams,
} from '../types'
import type {
  XhsCommentItem,
  XhsCommentListResponse,
  XhsCommentUserInfo,
  XhsSubCommentItem,
  XhsSubCommentListResponse,
} from './types'

// ============================================================================
// 数据转换函数
// ============================================================================

/**
 * 转换小红书用户信息为统一格式
 */
function transformUser(userInfo: XhsCommentUserInfo): CommentUser {
  return {
    id: userInfo.user_id,
    nickname: userInfo.nickname,
    avatar: userInfo.image,
    xsecToken: userInfo.xsec_token,
  }
}

/**
 * 检查是否为作者
 */
function checkIsAuthor(showTags: string[]): boolean {
  return showTags?.includes('is_author') ?? false
}

/**
 * 转换小红书子评论为统一格式
 */
function transformSubComment(item: XhsSubCommentItem): CommentItem {
  return {
    id: item.id,
    content: item.content,
    createTime: item.create_time,
    likeCount: parseInt(item.like_count, 10) || 0,
    user: transformUser(item.user_info),
    ipLocation: item.ip_location,
    isAuthor: checkIsAuthor(item.show_tags),
    isLiked: item.liked,
    // 子评论没有更深层的回复
    replyCount: 0,
    replies: [],
    hasMoreReplies: false,
    // 回复目标
    replyTo: item.target_comment
      ? {
          id: item.target_comment.id,
          user: transformUser(item.target_comment.user_info),
        }
      : undefined,
    origin: item,
  }
}

/**
 * 转换小红书评论为统一格式
 */
function transformComment(item: XhsCommentItem): CommentItem {
  return {
    id: item.id,
    content: item.content,
    createTime: item.create_time,
    likeCount: parseInt(item.like_count, 10) || 0,
    user: transformUser(item.user_info),
    ipLocation: item.ip_location,
    isAuthor: checkIsAuthor(item.show_tags),
    isLiked: item.liked,
    // 子评论相关
    replyCount: parseInt(item.sub_comment_count, 10) || 0,
    replies: (item.sub_comments || []).map(transformSubComment),
    replyCursor: item.sub_comment_cursor || '',
    hasMoreReplies: item.sub_comment_has_more,
    origin: item,
  }
}

// ============================================================================
// API 调用函数
// ============================================================================

/**
 * 获取评论列表
 * @param params 评论列表请求参数
 */
export async function getCommentList(params: CommentListParams): Promise<CommentListResult> {
  // 检查插件
  if (!window.AIToEarnPlugin) {
    return {
      success: false,
      message: '插件未安装或未就绪',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }

  const { workId, cursor = '', count = 10, xsecToken = '' } = params

  try {
    // 构建请求参数
    const queryParams = new URLSearchParams({
      note_id: workId,
      cursor,
      top_comment_id: '',
      image_formats: 'jpg,webp,avif',
    })

    // 如果有 xsec_token，添加到参数中
    if (xsecToken) {
      queryParams.set('xsec_token', xsecToken)
    }

    const response = await window.AIToEarnPlugin.xhsRequest<XhsCommentListResponse>({
      path: `/api/sns/web/v2/comment/page?${queryParams.toString()}`,
      method: 'GET',
    })

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.msg || '获取评论列表失败',
        comments: [],
        cursor: '',
        hasMore: false,
        rawData: response,
      }
    }

    // 转换数据格式
    const comments = (response.data.comments || []).map(transformComment)

    return {
      success: true,
      comments,
      cursor: response.data.cursor || '',
      hasMore: response.data.has_more,
      rawData: response,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '请求失败',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }
}

/**
 * 获取子评论列表（查看更多回复）
 * @param params 子评论列表请求参数
 */
export async function getSubCommentList(params: SubCommentListParams): Promise<CommentListResult> {
  // 检查插件
  if (!window.AIToEarnPlugin) {
    return {
      success: false,
      message: '插件未安装或未就绪',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }

  const { workId, rootCommentId, cursor = '', count = 10, xsecToken = '' } = params

  try {
    // 构建请求参数
    const queryParams = new URLSearchParams({
      note_id: workId,
      root_comment_id: rootCommentId,
      num: String(count),
      cursor,
      image_formats: 'jpg,webp,avif',
      top_comment_id: '',
    })

    // 如果有 xsec_token，添加到参数中
    if (xsecToken) {
      queryParams.set('xsec_token', xsecToken)
    }

    const response = await window.AIToEarnPlugin.xhsRequest<XhsSubCommentListResponse>({
      path: `/api/sns/web/v2/comment/sub/page?${queryParams.toString()}`,
      method: 'GET',
    })

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.msg || '获取子评论列表失败',
        comments: [],
        cursor: '',
        hasMore: false,
        rawData: response,
      }
    }

    // 转换数据格式
    const comments = (response.data.comments || []).map(transformSubComment)

    return {
      success: true,
      comments,
      cursor: response.data.cursor || '',
      hasMore: response.data.has_more,
      rawData: response,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '请求失败',
      comments: [],
      cursor: '',
      hasMore: false,
    }
  }
}

