// 自动任务的进度标识
export enum AutorReplyCommentScheduleEvent {
  Start = 'start', // 开始
  GetCommentListStart = 'getCommentListStart', // 获取评论列表开始
  GetCommentListEnd = 'getCommentListEnd', // 获取评论列表结束
  ReplyCommentStart = 'replyCommentStart', // 评论开始
  ReplyCommentEnd = 'replyCommentEnd', // 评论结束
  End = 'end', // 结束
  Error = 'error', // 错误
}

export const AutorReplyCommentScheduleEventTagStrMap = new Map([
  [AutorReplyCommentScheduleEvent.Start, '开始'],
  [AutorReplyCommentScheduleEvent.GetCommentListStart, '获取评论列表开始'],
  [AutorReplyCommentScheduleEvent.GetCommentListEnd, '获取评论列表结束'],
  [AutorReplyCommentScheduleEvent.ReplyCommentStart, '评论开始'],
  [AutorReplyCommentScheduleEvent.ReplyCommentEnd, '评论结束'],
]);
