import { AccountGroup, AccountGroupSchema } from './account-group.schema'
import { Account, AccountSchema } from './account.schema'
import { AiLog, AiLogSchema } from './ai-log.schema'
import { Asset, AssetSchema } from './asset.schema'
import { Blog, BlogSchema } from './blog.schema'
import { ContentGenerationTask, ContentGenerationTaskSchema } from './content-generation-task.schema'
import {
  CreditsBalance,
  CreditsBalanceSchema,
} from './credits-balance.schema'
import {
  CreditsRecord,
  CreditsRecordSchema,
} from './credits-record.schema'
import { MaterialAdaptation, MaterialAdaptationSchema } from './material-adaptation.schema'
import { MaterialGroup, MaterialGroupSchema } from './material-group.schema'
import { MaterialTask, MaterialTaskSchema } from './material-task.schema'
import { Material, MaterialSchema } from './material.schema'
import { MediaGroup, MediaGroupSchema } from './media-group.schema'
import { Media, MediaSchema } from './media.schema'
import { Notification, NotificationSchema } from './notification.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.schema'
import {
  PointsRecord,
  PointsRecordSchema,
} from './points-record.schema'
import { PublishDayInfo, PublishDayInfoSchema } from './publish-day-info.schema'
import { PublishInfo, PublishInfoSchema } from './publish-info.schema'
import { PublishRecord, PublishRecordSchema } from './publish-record.schema'
import { QrCodeArtImage, QrCodeArtImageSchema } from './qr-code-art-image.schema'
import {
  UserNotificationControl,
  UserNotificationControlSchema,
} from './user-notification-control.schema'
import {
  User,
  UserSchema,
} from './user.schema'

export * from './account-group.schema'
export * from './account.schema'
export * from './ai-log.schema'
export * from './asset.schema'
export * from './blog.schema'
export * from './content-generation-task.schema'
export * from './credits-balance.schema'
export * from './credits-record.schema'
export * from './material-adaptation.schema'
export * from './material-group.schema'
export * from './material-task.schema'
export * from './material.schema'
export * from './media-group.schema'
export * from './media.schema'
export * from './notification.schema'
export * from './oauth2-credential.schema'
export * from './points-record.schema'
export * from './publish-day-info.schema'
export * from './publish-info.schema'
export * from './publish-record.schema'
export * from './qr-code-art-image.schema'
export * from './user-notification-control.schema'
export * from './user.schema'

export const schemas = [
  { name: User.name, schema: UserSchema },
  { name: CreditsBalance.name, schema: CreditsBalanceSchema },
  { name: CreditsRecord.name, schema: CreditsRecordSchema },
  { name: PointsRecord.name, schema: PointsRecordSchema },
  { name: AiLog.name, schema: AiLogSchema },
  { name: Blog.name, schema: BlogSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: Account.name, schema: AccountSchema },
  { name: AccountGroup.name, schema: AccountGroupSchema },
  { name: MediaGroup.name, schema: MediaGroupSchema },
  { name: Media.name, schema: MediaSchema },
  { name: Material.name, schema: MaterialSchema },
  { name: MaterialAdaptation.name, schema: MaterialAdaptationSchema },
  { name: MaterialGroup.name, schema: MaterialGroupSchema },
  { name: MaterialTask.name, schema: MaterialTaskSchema },
  { name: PublishDayInfo.name, schema: PublishDayInfoSchema },
  { name: PublishInfo.name, schema: PublishInfoSchema },
  { name: PublishRecord.name, schema: PublishRecordSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: ContentGenerationTask.name, schema: ContentGenerationTaskSchema },
  { name: UserNotificationControl.name, schema: UserNotificationControlSchema },
  { name: Asset.name, schema: AssetSchema },
  // QR Code Art
  { name: QrCodeArtImage.name, schema: QrCodeArtImageSchema },
] as const
