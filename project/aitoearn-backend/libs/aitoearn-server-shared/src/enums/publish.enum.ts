export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishStatus {
  Failed = -1,
  WaitingForPublish = 0, // 未发布
  Published = 1,
  Publishing = 2,
  WaitingForUpdate = 3,
  Updating = 4,
  UpdatedFailed = 5,
  Queued = 6,
  PlatformScheduled = 7,
  WaitingForUserAction = 8,
  Canceled = 9,
}

export enum PublishRecordLinkStatus {
  PENDING = 'pending',
  READY = 'ready',
  FAILED = 'failed',
}

export enum PublishingTaskType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishRecordSource {
  Publish = 'publish', // 历史正常发布流程
  TaskLink = 'task_link', // 任务系统作品链接提交
  OfflineQr = 'offline_qr', // 线下扫描二维码发布
  Web = 'web', // Web 发布入口
  Api = 'api', // API 发布入口
  Internal = 'internal', // 内部服务创建
  Mcp = 'mcp', // MCP 发布入口
}
