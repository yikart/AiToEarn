/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:31
 * @LastEditTime: 2025-03-23 19:39:34
 * @LastEditors: nevin
 * @Description: 工具枚举
 */

// 发送消息的事件key
export enum SendChannelEnum {
  // 账户登录或更新
  AccountLoginFinish = 'AccountLoginFinish',
  // 图文发布进度
  ImgTextPublishProgress = 'ImgTextPublishProgress',
  // 视频发布进度发送
  VideoPublishProgress = 'VideoPublishProgress',
  // 自动运行进度或状态
  AutoRun = 'AutoRun',
  CommentRelyProgress = 'CommentRelyProgress',
  // 评论互动进度
  InteractionProgress = 'InteractionProgress',
  // 视频发布完成后待审核变成审核的事件
  VideoAuditFinish = 'VideoAuditFinish',
}
