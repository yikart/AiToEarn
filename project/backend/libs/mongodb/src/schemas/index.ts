import { Account, AccountSchema } from './account.schema'
import { AccountGroup, AccountGroupSchema } from './accountGroup.schema'
import { AiLog, AiLogSchema } from './ai-log.schema'
import { ApiKeyAccount, ApiKeyAccountSchema } from './api-key-account.schema'
import { ApiKey, ApiKeySchema } from './api-key.schema'
import { AppConfig, AppConfigSchema } from './app-config.schema'
import { Blog, BlogSchema } from './blog.schema'
import { Feedback, FeedbackSchema } from './feedback.schema'
import { Material, MaterialSchema } from './material.schema'
import { MaterialGroup, MaterialGroupSchema } from './materialGroup.schema'
import { MaterialTask, MaterialTaskSchema } from './materialTask.schema'
import { Media, MediaSchema } from './media.schema'
import { MediaGroup, MediaGroupSchema } from './mediaGroup.schema'
import { Notification, NotificationSchema } from './notification.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.schema'
import {
  PointsRecord,
  PointsRecordSchema,
} from './points-record.schema'
import { PublishDayInfo, PublishDayInfoSchema } from './publishDayInfo.schema'
import { PublishInfo, PublishInfoSchema } from './publishInfo.schema'
import { PublishTask, PublishTaskSchema } from './publishing-task.schema'
import { PublishRecord, PublishRecordSchema } from './publishRecord.schema'
import {
  User,
  UserSchema,
} from './user.schema'

export * from './account.schema'
export * from './accountGroup.schema'
export * from './ai-log.schema'
export * from './api-key-account.schema'
export * from './api-key.schema'
export * from './app-config.schema'
export * from './blog.schema'
export * from './feedback.schema'
export * from './material.schema'
export * from './materialGroup.schema'
export * from './materialTask.schema'
export * from './media.schema'
export * from './mediaGroup.schema'
export * from './notification.schema'
export * from './oauth2-credential.schema'
export * from './points-record.schema'
export * from './points-record.schema'
export * from './publishDayInfo.schema'
export * from './publishInfo.schema'
export * from './publishing-task.schema'
export * from './publishRecord.schema'
export * from './user.schema'

export const schemas = [
  { name: User.name, schema: UserSchema },
  { name: PointsRecord.name, schema: PointsRecordSchema },
  { name: AiLog.name, schema: AiLogSchema },
  { name: AppConfig.name, schema: AppConfigSchema },
  { name: Blog.name, schema: BlogSchema },
  { name: Feedback.name, schema: FeedbackSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: Account.name, schema: AccountSchema },
  { name: AccountGroup.name, schema: AccountGroupSchema },
  { name: MediaGroup.name, schema: MediaGroupSchema },
  { name: Media.name, schema: MediaSchema },
  { name: Material.name, schema: MaterialSchema },
  { name: MaterialGroup.name, schema: MaterialGroupSchema },
  { name: MaterialTask.name, schema: MaterialTaskSchema },
  { name: PublishDayInfo.name, schema: PublishDayInfoSchema },
  { name: PublishInfo.name, schema: PublishInfoSchema },
  { name: PublishRecord.name, schema: PublishRecordSchema },
  { name: ApiKey.name, schema: ApiKeySchema },
  { name: ApiKeyAccount.name, schema: ApiKeyAccountSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: PublishTask.name, schema: PublishTaskSchema },
] as const
