/**
 * 小红书平台工具
 * 通过插件提供的通用请求方法实现评论、点赞、收藏等功能
 */

/**
 * 评论参数
 */
export interface XhsCommentParams {
  /** 作品ID（笔记ID） */
  workId: string
  /** 评论内容 */
  content: string
  /** 回复的评论ID（可选，如果是回复评论） */
  replyToCommentId?: string
}

/**
 * 评论结果
 */
export interface XhsCommentResult {
  /** 是否成功 */
  success: boolean
  /** 评论ID */
  commentId?: string
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  code?: number
}

/**
 * 点赞/取消点赞结果
 */
export interface XhsLikeResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  code?: number
}

/**
 * 收藏/取消收藏结果
 */
export interface XhsFavoriteResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  code?: number
}

/**
 * 点赞作品
 * @param workId 作品ID
 * @param isLike true 点赞，false 取消点赞
 * @returns 点赞结果
 */
export async function likeWork(
  workId: string,
  isLike: boolean,
): Promise<XhsLikeResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  const path = isLike
    ? '/api/sns/web/v1/note/like'
    : '/api/sns/web/v1/note/dislike'

  const data = {
    note_oid: workId,
  }

  const response = await window.AIToEarnPlugin.xhsRequest<XhsLikeResult>({
    path,
    method: 'POST',
    data,
  })

  return response
}

/**
 * 评论作品
 * @param params 评论参数
 * @returns 评论结果
 */
export async function commentWork(
  params: XhsCommentParams,
): Promise<XhsCommentResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  const path = '/api/sns/web/v1/comment/post'

  // 构建请求数据
  const data: {
    note_id: string
    content: string
    at_users: Array<{ user_id: string, nickname: string }>
    target_comment_id?: string
  } = {
    note_id: params.workId,
    content: params.content,
    at_users: [],
  }

  // 如果有回复的评论ID，则为二级评论
  if (params.replyToCommentId) {
    data.target_comment_id = params.replyToCommentId
  }

  const response = await window.AIToEarnPlugin.xhsRequest<{
    success: boolean
    code: number
    msg?: string
    data?: {
      comment: {
        id: string
        [key: string]: any
      }
    }
  }>({
    path,
    method: 'POST',
    data,
  })

  return {
    success: response.success,
    commentId: response.data?.comment?.id,
    msg: response.msg,
    code: response.code,
  }
}

/**
 * 收藏作品
 * @param workId 作品ID
 * @param isFavorite true 收藏，false 取消收藏
 * @returns 收藏结果
 */
export async function favoriteWork(
  workId: string,
  isFavorite: boolean,
): Promise<XhsFavoriteResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  if (isFavorite) {
    // 收藏
    const path = '/api/sns/web/v1/note/collect'
    const data = {
      note_id: workId,
    }

    const response = await window.AIToEarnPlugin.xhsRequest<XhsFavoriteResult>({
      path,
      method: 'POST',
      data,
    })

    return response
  }
  else {
    // 取消收藏
    const path = '/api/sns/web/v1/note/uncollect'
    const data = {
      note_ids: workId,
    }

    const response = await window.AIToEarnPlugin.xhsRequest<XhsFavoriteResult>({
      path,
      method: 'POST',
      data,
    })

    return response
  }
}

