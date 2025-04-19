// 自动任务的进度标识
export enum AutorWorksInteractionScheduleEvent {
  Start = 'start', // 开始
  GetCommentListStart = 'getCommentListStart', // 获取评论列表开始
  GetCommentListEnd = 'getCommentListEnd', // 获取评论列表结束
  ReplyCommentStart = 'replyCommentStart', // 评论开始
  ReplyCommentEnd = 'replyCommentEnd', // 评论结束
  End = 'end', // 结束
  Error = 'error', // 错误
}

export const AutorWorksInteractionScheduleEventMap = new Map([
  [AutorWorksInteractionScheduleEvent.Start, '开始'],
  [AutorWorksInteractionScheduleEvent.GetCommentListStart, '获取评论列表开始'],
  [AutorWorksInteractionScheduleEvent.GetCommentListEnd, '获取评论列表结束'],
  [AutorWorksInteractionScheduleEvent.ReplyCommentStart, '评论开始'],
  [AutorWorksInteractionScheduleEvent.ReplyCommentEnd, '评论结束'],
]);
