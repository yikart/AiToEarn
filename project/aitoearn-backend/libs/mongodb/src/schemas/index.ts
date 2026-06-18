import { AccountGroup, AccountGroupSchema } from './account-group.schema'
import { Account, AccountSchema } from './account.schema'
import { AiLog, AiLogSchema } from './ai-log.schema'
import { ApiKey, ApiKeySchema } from './api-key.schema'
import { AppConfig, AppConfigSchema } from './app-config.schema'
import { Asset, AssetSchema } from './asset.schema'
import { Blog, BlogSchema } from './blog.schema'
import { ContentGenerationTask, ContentGenerationTaskSchema } from './content-generation-task.schema'
import { DraftGenerationMemory, DraftGenerationMemorySchema } from './draft-generation-memory.schema'
import { MaterialGroup, MaterialGroupSchema } from './material-group.schema'
import { Material, MaterialSchema } from './material.schema'
import { MediaGroup, MediaGroupSchema } from './media-group.schema'
import { Media, MediaSchema } from './media.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.schema'
import { PublishDayInfo, PublishDayInfoSchema } from './publish-day-info.schema'
import { PublishInfo, PublishInfoSchema } from './publish-info.schema'
import { PublishRecord, PublishRecordSchema } from './publish-record.schema'
import {
  User,
  UserSchema,
} from './user.schema'

export * from './account-group.schema'
export * from './account.schema'
export * from './ai-log.schema'
export * from './api-key.schema'
export * from './app-config.schema'
export * from './asset.schema'
export * from './blog.schema'
export * from './content-generation-task.schema'
export * from './draft-generation-memory.schema'
export * from './material-group.schema'
export * from './material.schema'
export * from './media-group.schema'
export * from './media.schema'
export * from './oauth2-credential.schema'
export * from './publish-day-info.schema'
export * from './publish-info.schema'
export * from './publish-record.schema'
export * from './user.schema'

export const schemas = [
  { name: User.name, schema: UserSchema },
  { name: AiLog.name, schema: AiLogSchema },
  { name: AppConfig.name, schema: AppConfigSchema },
  { name: Blog.name, schema: BlogSchema },
  { name: Account.name, schema: AccountSchema },
  { name: ApiKey.name, schema: ApiKeySchema },
  { name: AccountGroup.name, schema: AccountGroupSchema },
  { name: MediaGroup.name, schema: MediaGroupSchema },
  { name: Media.name, schema: MediaSchema },
  { name: Material.name, schema: MaterialSchema },
  { name: MaterialGroup.name, schema: MaterialGroupSchema },
  { name: PublishDayInfo.name, schema: PublishDayInfoSchema },
  { name: PublishInfo.name, schema: PublishInfoSchema },
  { name: PublishRecord.name, schema: PublishRecordSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: ContentGenerationTask.name, schema: ContentGenerationTaskSchema },
  { name: DraftGenerationMemory.name, schema: DraftGenerationMemorySchema },
  { name: Asset.name, schema: AssetSchema },
] as const
