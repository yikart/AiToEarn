/**
 * 抖音平台工具
 * 通过插件提供的通用请求方法实现评论、点赞、收藏等功能
 */

/**
 * 评论参数
 */
export interface DouyinCommentParams {
  /** 作品ID */
  workId: string
  /** 评论内容 */
  content: string
  /** 回复的评论ID（可选，如果是回复评论） */
  replyToCommentId?: string
}

/**
 * 评论结果
 */
export interface DouyinCommentResult {
  /** 是否成功 */
  success: boolean
  /** 评论ID */
  commentId?: string
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  statusCode?: number
}

/**
 * 点赞/取消点赞结果
 */
export interface DouyinLikeResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  statusCode?: number
}

/**
 * 收藏/取消收藏结果
 */
export interface DouyinFavoriteResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  msg?: string
  /** 响应码 */
  statusCode?: number
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
): Promise<DouyinLikeResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  // 抖音点赞 API
  const path = '/web/api/media/aweme/favorite/'

  const data = {
    aweme_id: workId,
    action: isLike ? 1 : 0, // 1: 点赞, 0: 取消点赞
  }

  const response = await window.AIToEarnPlugin.douyinRequest<{
    status_code: number
    status_msg?: string
  }>({
    path,
    method: 'POST',
    data,
  })

  return {
    success: response.status_code === 0,
    msg: response.status_msg,
    statusCode: response.status_code,
  }
}

/**
 * 评论作品
 * @param params 评论参数
 * @returns 评论结果
 */
export async function commentWork(
  params: DouyinCommentParams,
): Promise<DouyinCommentResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  // 抖音评论 API
  const path = '/web/api/media/aweme/comment/post/'

  const data: {
    aweme_id: string
    text: string
    reply_id?: string
  } = {
    aweme_id: params.workId,
    text: params.content,
  }

  // 如果有回复的评论ID
  if (params.replyToCommentId) {
    data.reply_id = params.replyToCommentId
  }

  const response = await window.AIToEarnPlugin.douyinRequest<{
    status_code: number
    status_msg?: string
    comment?: {
      cid: string
      [key: string]: any
    }
  }>({
    path,
    method: 'POST',
    data,
  })

  return {
    success: response.status_code === 0,
    commentId: response.comment?.cid,
    msg: response.status_msg,
    statusCode: response.status_code,
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
): Promise<DouyinFavoriteResult> {
  if (!window.AIToEarnPlugin) {
    throw new Error('插件未安装或未就绪')
  }

  // 抖音收藏 API
  const path = '/web/api/media/aweme/collect/'

  const data = {
    aweme_id: workId,
    action: isFavorite ? 1 : 0, // 1: 收藏, 0: 取消收藏
  }

  const response = await window.AIToEarnPlugin.douyinRequest<{
    status_code: number
    status_msg?: string
  }>({
    path,
    method: 'POST',
    data,
  })

  return {
    success: response.status_code === 0,
    msg: response.status_msg,
    statusCode: response.status_code,
  }
}

