/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:31
 * @LastEditTime: 2025-03-23 11:46:42
 * @LastEditors: nevin
 * @Description: 工具枚举
 */
// 发送消息的事件key
export enum SendChannelEnum {
  // 账户登录或更新
  AccountLoginFinish = 'AccountLoginFinish',
  // 视频发布进度发送
  VideoPublishProgress = 'VideoPublishProgress',
  // 自动运行失败
  AutoRunError = 'AutoRunError',
}
