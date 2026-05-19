import { AccountGroupRepository } from './account-group.repository'
import { AccountRepository } from './account.repository'
import { AiLogRepository } from './ai-log.repository'
import { ApiKeyRepository } from './api-key.repository'
import { AssetRepository } from './asset.repository'
import { BlogRepository } from './blog.repository'
import { ContentGenerationTaskRepository } from './content-generation-task.repository'
import { DraftGenerationMemoryRepository } from './draft-generation-memory.repository'
import { MaterialGroupRepository } from './material-group.repository'
import { MaterialRepository } from './material.repository'
import { MediaGroupRepository } from './media-group.repository'
import { MediaRepository } from './media.repository'
import { NotificationRepository } from './notification.repository'
import { PublishRecordRepository } from './publish-record.repository'
import { QrCodeArtImageRepository } from './qr-code-art-image.repository'
import { UserNotificationControlRepository } from './user-notification-control.repository'
import { UserRepository } from './user.repository'

export * from './account-group.repository'
export * from './account.repository'
export * from './ai-log.repository'
export * from './api-key.repository'
export * from './asset.repository'
export * from './base.repository'
export * from './blog.repository'
export * from './content-generation-task.repository'
export * from './draft-generation-memory.repository'
export * from './material-group.repository'
export * from './material.repository'
export * from './media-group.repository'
export * from './media.repository'
export * from './notification.repository'
export * from './oauth2-credential.repository'
export * from './publish-record.repository'
export * from './qr-code-art-image.repository'
export * from './user-notification-control.repository'
export * from './user.repository'

export const repositories = [
  AiLogRepository,
  AssetRepository,
  BlogRepository,
  NotificationRepository,
  UserRepository,
  AccountRepository,
  AccountGroupRepository,
  ApiKeyRepository,
  MediaRepository,
  MediaGroupRepository,
  MaterialGroupRepository,
  MaterialRepository,
  PublishRecordRepository,
  ContentGenerationTaskRepository,
  DraftGenerationMemoryRepository,
  UserNotificationControlRepository,
  QrCodeArtImageRepository,
] as const
