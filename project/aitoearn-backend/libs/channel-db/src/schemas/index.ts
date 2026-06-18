import { Account, AccountSchema } from './account.schema'
import { ChannelAccountDataSnapshot, ChannelAccountDataSnapshotSchema } from './channel-account-data-snapshot.schema'
import { ChannelAuthIdentity, ChannelAuthIdentitySchema } from './channel-auth-identity.schema'
import { ChannelWorkDataSnapshot, ChannelWorkDataSnapshotSchema } from './channel-work-data-snapshot.schema'
import { EngagementSubTask, EngagementSubTaskSchema, EngagementTask, EngagementTaskSchema } from './engagement-task.schema'
import { InteractionRecord, InteractionRecordSchema } from './interaction-record.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.schema'
import { ReplyCommentRecord, ReplyCommentRecordSchema } from './reply-comment-record.schema'

export * from './account.schema'
export * from './channel-account-data-snapshot.schema'
export * from './channel-auth-identity.schema'
export * from './channel-work-data-snapshot.schema'
export * from './engagement-task.schema'
export * from './interaction-record.schema'
export * from './oauth2-credential.schema'
export * from './reply-comment-record.schema'

export const schemas = [
  { name: Account.name, schema: AccountSchema },
  { name: ChannelAccountDataSnapshot.name, schema: ChannelAccountDataSnapshotSchema },
  { name: ChannelAuthIdentity.name, schema: ChannelAuthIdentitySchema },
  { name: ChannelWorkDataSnapshot.name, schema: ChannelWorkDataSnapshotSchema },
  { name: EngagementTask.name, schema: EngagementTaskSchema },
  { name: EngagementSubTask.name, schema: EngagementSubTaskSchema },
  { name: InteractionRecord.name, schema: InteractionRecordSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: ReplyCommentRecord.name, schema: ReplyCommentRecordSchema },
] as const
