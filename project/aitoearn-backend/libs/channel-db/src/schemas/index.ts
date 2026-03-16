import { Account, AccountSchema } from './account.schema'
import { EngagementSubTask, EngagementSubTaskSchema, EngagementTask, EngagementTaskSchema } from './engagement-task.schema'
import { InteractionRecord, InteractionRecordSchema } from './interaction-record.schema'
import { OAuth2Credential, OAuth2CredentialSchema } from './oauth2-credential.schema'
import { PostMediaContainer, PostMediaContainerSchema } from './post-media-container.schema'
import { ReplyCommentRecord, ReplyCommentRecordSchema } from './reply-comment-record.schema'

export * from './account.schema'
export * from './engagement-task.schema'
export * from './interaction-record.schema'
export * from './oauth2-credential.schema'
export * from './post-media-container.schema'
export * from './reply-comment-record.schema'

export const schemas = [
  { name: Account.name, schema: AccountSchema },
  { name: EngagementTask.name, schema: EngagementTaskSchema },
  { name: EngagementSubTask.name, schema: EngagementSubTaskSchema },
  { name: InteractionRecord.name, schema: InteractionRecordSchema },
  { name: OAuth2Credential.name, schema: OAuth2CredentialSchema },
  { name: PostMediaContainer.name, schema: PostMediaContainerSchema },
  { name: ReplyCommentRecord.name, schema: ReplyCommentRecordSchema },
] as const
