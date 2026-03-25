import { AccountGroupRepository } from './account-group.repository'
import { AccountRepository } from './account.repository'
import { AiLogRepository } from './ai-log.repository'
import { ApiKeyRepository } from './api-key.repository'
import { AssetRepository } from './asset.repository'
import { BlogRepository } from './blog.repository'
import { ContentGenerationTaskRepository } from './content-generation-task.repository'
import { CreditsBalanceRepository } from './credits-balance.repository'
import { CreditsRecordRepository } from './credits-record.repository'
import { MaterialAdaptationRepository } from './material-adaptation.repository'
import { MaterialGroupRepository } from './material-group.repository'
import { MaterialTaskRepository } from './material-task.repository'
import { MaterialRepository } from './material.repository'
import { MediaGroupRepository } from './media-group.repository'
import { MediaRepository } from './media.repository'
import { NotificationRepository } from './notification.repository'
import { PointsRecordRepository } from './points-record.repository'
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
export * from './credits-balance.repository'
export * from './credits-record.repository'
export * from './material-adaptation.repository'
export * from './material-group.repository'
export * from './material-task.repository'
export * from './material.repository'
export * from './media-group.repository'
export * from './media.repository'
export * from './notification.repository'
export * from './oauth2-credential.repository'
export * from './points-record.repository'
export * from './publish-record.repository'
export * from './qr-code-art-image.repository'
export * from './user-notification-control.repository'
export * from './user.repository'

export const repositories = [
  AiLogRepository,
  AssetRepository,
  BlogRepository,
  NotificationRepository,
  CreditsBalanceRepository,
  CreditsRecordRepository,
  PointsRecordRepository,
  UserRepository,
  AccountRepository,
  AccountGroupRepository,
  ApiKeyRepository,
  MediaRepository,
  MediaGroupRepository,
  MaterialAdaptationRepository,
  MaterialGroupRepository,
  MaterialRepository,
  MaterialTaskRepository,
  PublishRecordRepository,
  ContentGenerationTaskRepository,
  UserNotificationControlRepository,
  QrCodeArtImageRepository,
] as const
