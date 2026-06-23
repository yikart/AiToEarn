import { AccountGroupRepository } from './account-group.repository'
import { AccountRepository } from './account.repository'
import { AiLogRepository } from './ai-log.repository'
import { ApiKeyRepository } from './api-key.repository'
import { AppConfigRepository } from './app-config.repository'
import { AssetRepository } from './asset.repository'
import { BlogRepository } from './blog.repository'
import { ContentGenerationTaskRepository } from './content-generation-task.repository'
import { DraftGenerationMemoryRepository } from './draft-generation-memory.repository'
import { MaterialGroupRepository } from './material-group.repository'
import { MaterialRepository } from './material.repository'
import { MediaGroupRepository } from './media-group.repository'
import { MediaRepository } from './media.repository'
import { OAuth2CredentialRepository } from './oauth2-credential.repository'
import { PublishRecordRepository } from './publish-record.repository'
import { UserRepository } from './user.repository'

export * from './account-group.repository'
export * from './account.repository'
export * from './ai-log.repository'
export * from './api-key.repository'
export * from './app-config.repository'
export * from './asset.repository'
export * from './base.repository'
export * from './blog.repository'
export * from './content-generation-task.repository'
export * from './draft-generation-memory.repository'
export * from './material-group.repository'
export * from './material.repository'
export * from './media-group.repository'
export * from './media.repository'
export * from './oauth2-credential.repository'
export * from './publish-record.repository'
export * from './user.repository'

export const repositories = [
  AiLogRepository,
  AppConfigRepository,
  AssetRepository,
  BlogRepository,
  UserRepository,
  AccountRepository,
  AccountGroupRepository,
  ApiKeyRepository,
  MediaRepository,
  MediaGroupRepository,
  MaterialGroupRepository,
  MaterialRepository,
  PublishRecordRepository,
  OAuth2CredentialRepository,
  ContentGenerationTaskRepository,
  DraftGenerationMemoryRepository,
] as const
