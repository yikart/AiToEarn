import { AccountRepository } from './account.repository'
import { AccountGroupRepository } from './accountGroup.repository'
import { AiLogRepository } from './ai-log.repository'
import { AppConfigRepository } from './app-config.repository'
import { BlogRepository } from './blog.repository'
import { FeedbackRepository } from './feedback.repository'
import { MaterialRepository } from './material.repository'
import { MaterialGroupRepository } from './materialGroup.repository'
import { MaterialTaskRepository } from './materialTask.repository'
import { MediaRepository } from './media.repository'
import { MediaGroupRepository } from './mediaGroup.repository'
import { NotificationRepository } from './notification.repository'
import { PointsRecordRepository } from './points-record.repository'
import { PublishedPostRepository } from './published-post.repository'
import { PublishRecordRepository } from './publishRecord.repository'
import { UserRepository } from './user.repository'
import { VipRepository } from './vip.repository'

export * from './account.repository'
export * from './accountGroup.repository'
export * from './ai-log.repository'
export * from './app-config.repository'
export * from './base.repository'
export * from './blog.repository'
export * from './feedback.repository'
export * from './material.repository'
export * from './materialGroup.repository'
export * from './materialTask.repository'
export * from './media.repository'
export * from './mediaGroup.repository'
export * from './notification.repository'
export * from './points-record.repository'
export * from './published-post.repository'
export * from './publishRecord.repository'
export * from './user.repository'
export * from './vip.repository'

export const repositories = [
  AiLogRepository,
  AppConfigRepository,
  BlogRepository,
  FeedbackRepository,
  NotificationRepository,
  PointsRecordRepository,
  UserRepository,
  AccountRepository,
  AccountGroupRepository,
  MediaRepository,
  MediaGroupRepository,
  VipRepository,
  MaterialGroupRepository,
  MaterialRepository,
  MaterialTaskRepository,
  PublishRecordRepository,
  PublishedPostRepository,
] as const
