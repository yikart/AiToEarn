/**
 * PublishStatus 枚举。
 */
export enum PublishStatus {
  FAIL = -1, // 发布失败，对应后端 FAILED
  UNPUBLISH = 0, // 未发布，对应后端 WaitingForPublish
  RELEASED = 1, // 已发布，对应后端 PUBLISHED
  PUB_LOADING = 2, // 发布中，对应后端 PUBLISHING
  WAITING_FOR_UPDATE = 3, // 等待更新
  UPDATING = 4, // 更新中
  UPDATED_FAILED = 5, // 更新失败
  QUEUED = 6, // 队列中
  PLATFORM_SCHEDULED = 7, // 平台已定时
  WAITING_FOR_USER_ACTION = 8, // 等待用户操作
  CANCELED = 9, // 已取消
}
