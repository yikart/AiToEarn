// 渠道互动
import http from '@/utils/request'

/**
 * 创建作品评论
 * @returns
 */
export function apiAddArcComment(data: {
  accountId: string
  dataId: string
  content: string
}) {
  return http.post<{ code: number, data: any }>(
    `channel/interact/addArcComment`,
    data,
  )
}

/**
 * 获取作品的评论列表
 * @returns
 */
export function apiGetArcCommentList(page: {
  pageNo: number
  pageSize: number
}, recordId: string) {
  return http.get<{ code: number, data: any }>(
    `channel/interact/getArcCommentList/${page.pageNo}/${page.pageSize}`,
    {
      params: {
        recordId,
      },
    },
  )
}

/**
 * 回复评论
 * @returns
 */
export function apiReplyComment(data: {
  accountId: string
  commentId: string
  content: string
}) {
  return http.post<{ code: number, data: any }>(
    `channel/interact/replyComment`,
    data,
  )
}

/**
 * 删除评论
 * @returns
 */
export function apiDelComment(data: {
  accountId: string
  commentId: string
}) {
  return http.delete<{ code: number, data: any }>(
    `channel/interact/delComment`,
    data,
  )
}
