/*
 * @Author: nevin
 * @Date: 2025-01-21 21:12:52
 * @LastEditTime: 2025-03-23 19:09:01
 * @LastEditors: nevin
 * @Description:
 */
// 自动任务的进度标识 开始 获取评论列表开始 获取评论列表结束 评论开始 评论结束 结束 错误
enum AutorReplyCommentScheduleEvent {
  Start = 'start',
  GetCommentListStart = 'getCommentListStart',
  GetCommentListEnd = 'getCommentListEnd',
  ReplyCommentStart = 'replyCommentStart',
  ReplyCommentEnd = 'replyCommentEnd',
  End = 'end',
  Error = 'error',
}
