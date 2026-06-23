import type { AccountType, WorkStatus } from '@yikart/common'
import { EventTopic } from './enum/event-topic.enum'

export interface EventPayloadObject {
  [key: string]: unknown
}

export type EventDate = Date | string

export type ChannelsPublishTaskErrorCategory
  = | 'auth'
    | 'permission'
    | 'rate_limit'
    | 'quota'
    | 'validation'
    | 'media_unavailable'
    | 'media_processing_failed'
    | 'not_found'
    | 'conflict'
    | 'platform_unavailable'
    | 'timeout'
    | 'network'
    | 'webhook_invalid'
    | 'sdk_error'
    | 'unknown'

export interface ChannelsAccountConnectedPayload {
  userId: string
  accountId: string
  platform: AccountType
}

export interface ChannelsAccountOfflinePayload {
  accountId: string
  platform: AccountType
  reason: string
}

export interface ChannelsPublishTaskCreatedPayload {
  id: string
  userId: string
  flowId?: string
  accountId: string
  accountType: AccountType
}

export interface ChannelsPublishTaskCompletionPayload {
  taskId: string
  publishRecordId?: string
  userId: string
  accountId?: string
  accountType: AccountType
  uid?: string
  platformWorkId?: string
  permalink?: string
  publishAt?: EventDate
  dataOption?: EventPayloadObject
  originalWorkLink?: string
  workStatus?: WorkStatus
  dataId?: string
  workLink?: string
  flowId?: string
  materialId?: string
  source?: string
  publishedAt?: EventDate
  linkStatus?: string
  linkMeta?: EventPayloadObject
}

export interface ChannelsPublishTaskPlatformScheduledPayload {
  taskId: string
  platformWorkId: string
  permalink?: string
  publishAt?: EventDate
  dataOption?: EventPayloadObject
}

export interface ChannelsPublishTaskUserActionPayload {
  schema?: string
  shortLink?: string
  expiresAt: EventDate
  data?: EventPayloadObject
}

export interface ChannelsPublishTaskWaitingForUserActionPayload {
  taskId: string
  userAction: ChannelsPublishTaskUserActionPayload
  platformWorkId?: string
  permalink?: string
  dataOption?: EventPayloadObject
}

export interface ChannelsPublishTaskErrorPayload {
  category: ChannelsPublishTaskErrorCategory
  code?: string
  message: string
  retryable: boolean
  occurredAt: EventDate
}

export interface ChannelsPublishTaskFailedPayload {
  taskId: string
  error: ChannelsPublishTaskErrorPayload
}

export interface ChannelsPublishTaskCanceledPayload {
  taskId: string
  reason?: string
}

export interface ChannelsPublishTaskUpdatedPayload {
  taskId: string
}

export interface EventPayloadMap {
  [EventTopic.UserCreated]: never
  [EventTopic.ChannelsPublishTaskPlatformScheduled]: ChannelsPublishTaskPlatformScheduledPayload
  [EventTopic.ChannelsPublishTaskWaitingForUserAction]: ChannelsPublishTaskWaitingForUserActionPayload
  [EventTopic.ChannelsPublishTaskPublished]: ChannelsPublishTaskCompletionPayload
  [EventTopic.ChannelsPublishTaskFailed]: ChannelsPublishTaskFailedPayload
  [EventTopic.ChannelsPublishTaskCanceled]: ChannelsPublishTaskCanceledPayload
  [EventTopic.ChannelsPublishTaskUpdateStarted]: never
  [EventTopic.ChannelsPublishTaskUpdated]: ChannelsPublishTaskUpdatedPayload
  [EventTopic.ChannelsPublishTaskUpdateFailed]: ChannelsPublishTaskFailedPayload
  [EventTopic.ChannelsAccountConnected]: ChannelsAccountConnectedPayload
  [EventTopic.ChannelsAccountUpdated]: never
  [EventTopic.ChannelsAccountOffline]: ChannelsAccountOfflinePayload
  [EventTopic.ChannelsCredentialRefreshed]: never
  [EventTopic.ChannelsCredentialExpired]: never
  [EventTopic.ChannelsCredentialRevoked]: never
  [EventTopic.ChannelsCredentialRefreshFailed]: never
  [EventTopic.ChannelsAuthFailed]: never
  [EventTopic.ChannelsPublishFlowCreated]: never
  [EventTopic.ChannelsPublishTaskCreated]: ChannelsPublishTaskCreatedPayload
  [EventTopic.ChannelsPublishTaskEnqueued]: never
  [EventTopic.ChannelsPublishTaskStarted]: never
  [EventTopic.ChannelsPublishTaskFinalizeTimeout]: never
  [EventTopic.ChannelsAnalyticsAccountFetched]: never
  [EventTopic.ChannelsAnalyticsWorkFetched]: never
  [EventTopic.ChannelsAnalyticsFetchFailed]: never
  [EventTopic.ChannelsEngagementCommentCreated]: never
}
