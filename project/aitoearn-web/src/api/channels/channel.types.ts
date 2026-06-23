import type { ChannelPublishStatus, PlatformStatus, PublishContentMode } from './channel.constants'
import type { PlatType } from '@/app/config/platConfig'
import type { PubType } from '@/app/config/publishConfig'

// Source: types/channelAuth.type.ts

/**
 * ChannelAuthSessionStatus 类型。
 */
export type ChannelAuthSessionStatus = 'pending' | 'completed' | 'failed'

/**
 * StartChannelAccountAuthParams 请求参数。
 */
export interface StartChannelAccountAuthParams {
  callbackUrl?: string
  redirectUri?: string
  groupId?: string
}

/**
 * StartChannelOAuthLoginParams 请求参数。
 */
export interface StartChannelOAuthLoginParams {
  redirectUri?: string
  inviteCode?: string
}

/**
 * ChannelAccountAuthStart 类型。
 */
export interface ChannelAccountAuthStart {
  url: string
  sessionId: string
  expiresAt?: string
}

/**
 * ChannelOAuthLoginStart 类型。
 */
export interface ChannelOAuthLoginStart {
  url: string
  sessionId: string
  expiresAt?: string
  authInstructions?: Record<string, string>
}

/**
 * ChannelAuthConnectedAccount 类型。
 */
export interface ChannelAuthConnectedAccount {
  accountId: string
  platform: PlatType
  platformUid: string
  displayName: string
  avatarUrl?: string
}

/**
 * ChannelAuthSelectableAccount 类型。
 */
export interface ChannelAuthSelectableAccount {
  platform: PlatType
  platformUid: string
  displayName: string
  avatarUrl?: string
  parentPlatformUid?: string
}

/**
 * ChannelAccountAuthStatus 类型。
 */
export interface ChannelAccountAuthStatus {
  sessionId: string
  status: ChannelAuthSessionStatus
  requiresSelection: boolean
  expiresAt?: string
  accountId?: string
  accountIds?: string[]
  accounts?: ChannelAuthConnectedAccount[]
  selectableAccounts?: ChannelAuthSelectableAccount[]
}

// Source: types/channelPlatform.ts

/**
 * PlatformAuthType 类型。
 */
export type PlatformAuthType = 'oauth2' | 'oauth1' | 'api_key' | 'browser' | 'plugin' | 'qrcode' | 'mobile_handoff'

/**
 * PlatformEditorType 类型。
 */
export type PlatformEditorType = 'none' | 'text' | 'normal' | 'markdown' | 'html'

/**
 * PlatformContentMode 类型。
 */
export type PlatformContentMode = PublishContentMode | PubType

/**
 * PublishOptionValueType 类型。
 */
export type PublishOptionValueType = 'list' | 'tree'

/**
 * PublishOptionValueItem 数据结构。
 */
export interface PublishOptionValueItem {
  value: string
  label: string
  description?: string
  disabled?: boolean
  children?: PublishOptionValueItem[]
  extra?: Record<string, unknown>
}

/**
 * PublishOptionValuesVo 响应数据。
 */
export interface PublishOptionValuesVo {
  field: string
  valueType: PublishOptionValueType
  items: PublishOptionValueItem[]
}

/**
 * PublishOptionCreatedValueVo 响应数据。
 */
export interface PublishOptionCreatedValueVo {
  field: string
  valueType: PublishOptionValueType
  item: PublishOptionValueItem
}

/**
 * PlatformDisplayName 类型。
 */
export interface PlatformDisplayName {
  'en-US'?: string
  'zh-CN'?: string
  [locale: string]: string | undefined
}

/**
 * PlatformContentLimits 类型。
 */
export interface PlatformContentLimits {
  modes?: PlatformContentMode[]
  maxTitleLength?: number
  maxBodyLength?: number
  maxTotalTextLength?: number
  maxMediaCount?: number
  maxImages?: number
  maxVideos?: number
}

/**
 * PlatformMediaRules 类型。
 */
export type PlatformMediaRules = Record<string, unknown>

/**
 * PlatformTopicRules 类型。
 */
export interface PlatformTopicRules {
  supported: boolean
  nativeField?: boolean
  maxCount?: number
  maxTotalLength?: number
}

/**
 * PlatformCapabilities 类型。
 */
export interface PlatformCapabilities {
  auth: Record<string, boolean>
  publish: Record<string, boolean | string | undefined>
  analytics: Record<string, boolean>
  engagement: Record<string, boolean>
  work: Record<string, boolean>
  browse: Record<string, boolean>
  webhook: Record<string, boolean>
}

/**
 * PlatformMetadataVo 响应数据。
 */
export interface PlatformMetadataVo {
  platform: PlatType
  status: PlatformStatus
  displayName: PlatformDisplayName
  logoUrl: string
  authType: PlatformAuthType
  authInstructions?: PlatformDisplayName
  editor: PlatformEditorType
  contentLimits: PlatformContentLimits
  mediaRules: PlatformMediaRules
  topic: PlatformTopicRules
  capabilities: PlatformCapabilities
  optionSchema: Record<string, unknown>
  defaultOption?: Record<string, unknown>
}

/**
 * PlatformPubParamsConfig 数据结构。
 */
export interface PlatformPubParamsConfig {
  titleMax?: number
  topicMax?: number
  topicMaxTotalLength?: number
  desMax: number
  imagesMax?: number
}

/**
 * PlatformInfo 数据结构。
 */
export interface PlatformInfo {
  type: PlatType
  platform: PlatType
  status: PlatformStatus
  name: string
  icon: string
  logoUrl: string
  authType: PlatformAuthType
  authInstruction?: string
  editor: PlatformEditorType
  capabilities: PlatformCapabilities
  contentLimits: PlatformContentLimits
  mediaRules: PlatformMediaRules
  topic: PlatformTopicRules
  optionSchema: Record<string, unknown>
  defaultOption?: Record<string, unknown>
  commonPubParamsConfig: PlatformPubParamsConfig
  pubTypes: Set<PubType>
  themeColor?: string
}

/**
 * PlatformInfoTuple 类型。
 */
export type PlatformInfoTuple = [PlatType, PlatformInfo]

// Source: types/channelPublish.type.ts

/**
 * ChannelPublishSource 类型。
 */
export type ChannelPublishSource
  = | 'publish' | 'web' | 'api' | 'internal' | 'mcp'

/**
 * ChannelPublishRecordEngagement 类型。
 */
export interface ChannelPublishRecordEngagement {
  viewCount: number
  commentCount: number
  likeCount: number
  shareCount: number
  clickCount: number
  impressionCount: number
  favoriteCount: number
}

/**
 * ChannelPublishRecordOption 数据结构。
 */
export interface ChannelPublishRecordOption {
  facebook?: {
    content_category?: string
  }
  [key: string]: unknown
}

/**
 * ChannelPublishMediaInput 数据结构。
 */
export interface ChannelPublishMediaInput {
  url: string
  metadata?: Record<string, unknown>
}

/**
 * ChannelPublishCoverInput 数据结构。
 */
export interface ChannelPublishCoverInput {
  url: string
  metadata?: Record<string, unknown>
}

/**
 * ChannelPublishContentInput 数据结构。
 */
export interface ChannelPublishContentInput {
  title?: string
  body?: string
  media: ChannelPublishMediaInput[]
  cover?: ChannelPublishCoverInput
}

/**
 * ChannelPublishContentOverride 类型。
 */
export interface ChannelPublishContentOverride {
  title?: string
  body?: string
  media?: ChannelPublishMediaInput[]
  cover?: ChannelPublishCoverInput | null
}

/**
 * ChannelPublishFlowContext 类型。
 */
export interface ChannelPublishFlowContext {
  type?: PubType.VIDEO | PubType.ImageText
  taskId?: string
  userTaskId?: string
  materialGroupId?: string
  materialId?: string
  source?: ChannelPublishSource
  videoUrl?: string
  imgUrlList?: string[]
}

/**
 * ChannelCreatePublishFlowItem 数据结构。
 */
export interface ChannelCreatePublishFlowItem {
  accountId: string
  platform: PlatType
  option?: Record<string, unknown>
  overrides?: ChannelPublishContentOverride
}

/**
 * ChannelCreatePublishFlowParams 请求参数。
 */
export interface ChannelCreatePublishFlowParams {
  flowId?: string
  content: ChannelPublishContentInput
  publishAt: string
  context?: ChannelPublishFlowContext
  items: ChannelCreatePublishFlowItem[]
}

/**
 * ChannelPublishFlowTaskVo 响应数据。
 */
export interface ChannelPublishFlowTaskVo {
  id: string
  accountId: string
  platform: PlatType
  status?: ChannelPublishStatus
  publishTime?: string
  platformWorkId?: string
  workLink?: string
  errorMsg?: string
}

/**
 * ChannelPublishFlowVo 响应数据。
 */
export interface ChannelPublishFlowVo {
  flowId: string
  tasks: ChannelPublishFlowTaskVo[]
}

/**
 * ChannelPublishRecordItem 数据结构。
 */
export interface ChannelPublishRecordItem {
  id: string
  flowId?: string
  taskId?: string
  userTaskId?: string
  userId?: string
  accountId?: string
  accountType: PlatType
  type: PubType.VIDEO | PubType.ImageText
  status: ChannelPublishStatus
  title?: string
  desc?: string
  publishTime: string | Date
  platformWorkId?: string
  workLink?: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  topics?: string[]
  source?: ChannelPublishSource
  errorMsg?: string
  createdAt?: string
  updatedAt?: string
  option?: ChannelPublishRecordOption
  dataOption?: Record<string, unknown>
  dataId?: string
  uid?: string
  taskMaterialId?: string
  inQueue?: boolean
  linkStatus?: 'pending' | 'ready' | 'failed'
  linkError?: string
  linkMeta?: Record<string, unknown>
  engagement?: ChannelPublishRecordEngagement
}

/**
 * ChannelPublicPublishRecordItem 数据结构。
 */
export type ChannelPublicPublishRecordItem
  = Partial<ChannelPublishRecordItem>
    & Pick<ChannelPublishRecordItem, 'id' | 'accountType' | 'type' | 'status' | 'publishTime'>

/**
 * ChannelPublishRecordListVo 响应数据。
 */
export type ChannelPublishRecordListVo
  = | ChannelPublishRecordItem[]
    | {
      records?: ChannelPublishRecordItem[]
      list?: ChannelPublishRecordItem[]
      items?: ChannelPublishRecordItem[]
      rows?: ChannelPublishRecordItem[]
    }


/**
 * ChannelPublishUserActionVo 响应数据。
 */
export interface ChannelPublishUserActionVo {
  recordId: string
  platform: PlatType.Douyin
  shareId: string
  schemeUrl: string
  shortLink: string
  expiresAt?: string | Date
}

/**
 * ChannelPublishRecordQueryParams 请求参数。
 */
export interface ChannelPublishRecordQueryParams {
  accountId?: string
  accountType?: PlatType
  status?: ChannelPublishStatus
  time?: [string, string]
}

/**
 * ChannelWorkQueryParams 请求参数。
 */
export interface ChannelWorkQueryParams {
  platform: PlatType
  accountId?: string
}

/**
 * ChannelWorkAnalyticsVo 响应数据。
 */
export interface ChannelWorkAnalyticsVo {
  platform: PlatType
  accountId?: string
  platformWorkId: string
  metrics?: ChannelWorkMetricsSnapshot
  fetchedAt?: string
  message?: string
  [key: string]: unknown
}

/**
 * ChannelWorkMetricsSnapshot 数据结构。
 */
export interface ChannelWorkMetricsSnapshot {
  viewCount?: number
  playCount?: number
  impressionCount?: number
  reachCount?: number
  likeCount?: number
  collectCount?: number
  commentCount?: number
  shareCount?: number
  saveCount?: number
  clickCount?: number
  engagementCount?: number
  watchTimeSeconds?: number
}
/**
 * Channel platform metadata list options.
 */
export interface ChannelPlatformListOptions {
  fresh?: boolean
}

/**
 * Channel publish task action response.
 */
export interface ChannelPublishTaskActionVo {
  taskId: string
}
