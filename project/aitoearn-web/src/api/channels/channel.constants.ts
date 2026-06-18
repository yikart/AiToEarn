/**
 * PublishContentMode 枚举。
 */
export enum PublishContentMode {
  Text = 'text', ImageText = 'image_text', Video = 'video',
}

/**
 * PlatformStatus 枚举。
 */
export enum PlatformStatus {
  Available = 'available', Unavailable = 'unavailable', ComingSoon = 'coming_soon',
}

/**
 * ChannelPublishStatus 枚举。
 */
export enum ChannelPublishStatus {
  Failed = -1,
  WaitingForPublish = 0,
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
