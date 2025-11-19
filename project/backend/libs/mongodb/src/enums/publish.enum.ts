export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishStatus {
  FAILED = -1, // 发布失败
  WaitingForPublish = 0, // 未发布
  PUBLISHED = 1, // 已发布
  PUBLISHING = 2, // 发布中
  WAITING_FOR_UPDATE = 3, // 等待更新
  UPDATING = 4, // 更新中
  UPDATED_FAILED = 5, // 更新失败
}
