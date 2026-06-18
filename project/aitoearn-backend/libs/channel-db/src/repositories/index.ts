import { ChannelAccountDataSnapshotRepository } from './channel-account-data-snapshot.repository'
import { ChannelAuthIdentityRepository } from './channel-auth-identity.repository'
import { ChannelWorkDataSnapshotRepository } from './channel-work-data-snapshot.repository'
import { EngagementSubTaskRepository } from './engagement-sub-task.repository'
import { EngagementTaskRepository } from './engagement-task.repository'
import { InteractionRecordRepository } from './interaction-record.repository'
import { OAuth2CredentialRepository } from './oauth2-credential.repository'
import { ReplyCommentRecordRepository } from './reply-comment-record.repository'

export * from './base.repository'
export * from './channel-account-data-snapshot.repository'
export * from './channel-auth-identity.repository'
export * from './channel-work-data-snapshot.repository'
export * from './engagement-sub-task.repository'
export * from './engagement-task.repository'
export * from './interaction-record.repository'
export * from './oauth2-credential.repository'
export * from './reply-comment-record.repository'

export const repositories = [
  ChannelAccountDataSnapshotRepository,
  ChannelAuthIdentityRepository,
  ChannelWorkDataSnapshotRepository,
  EngagementTaskRepository,
  EngagementSubTaskRepository,
  InteractionRecordRepository,
  ReplyCommentRecordRepository,
  OAuth2CredentialRepository,
] as const
