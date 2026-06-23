import type { AccountType, Locale, WorkStatus } from '@yikart/common'
import type { PublishRecordLinkStatus } from '@yikart/mongodb'
import type { Request, Response } from 'express'
import type { z } from 'zod'
import type { PlatformErrorCategory } from './platforms.exception'
import type { PublishMediaAdaptationOption } from './publish-media-adaptation.schema'
import type { PublishValidationIssue } from './publish.schema'

export enum CompletionStrategy {
  Sync = 'sync',
  Polling = 'polling',
  MediaFinalize = 'media_finalize',
  Webhook = 'webhook',
  UserHandoff = 'user_handoff',
}

export enum AuthType {
  OAuth2 = 'oauth2',
  Browser = 'browser',
  Plugin = 'plugin',
  QrCode = 'qrcode',
}

export enum AuthCallbackResponseType {
  Page = 'page',
  Json = 'json',
}

export enum EditorType {
  None = 'none',
  Text = 'text',
  Html = 'html',
}

export enum PublishContentMode {
  // TODO: 等前端重构
  // Text = 'text',
  // ImageText = 'image_text',
  Text = 'article2',
  ImageText = 'article',
  Video = 'video',
}

// ── Auth ──

export interface GenerateAuthUrlInput {
  userId?: string
  state: string
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'unknown'
  extras?: Record<string, unknown>
}

export interface GenerateAuthUrlResult {
  url: string
  state: string
  redirectUri: string
  extras?: Record<string, unknown>
}

export interface AuthCallbackInput {
  callbackUrl?: string
  query?: AuthCallbackQuery
  body?: AuthCallbackBody
  session: AuthCallbackSession
}

export interface AuthCallbackQuery {
  code?: string
  state?: string
  error?: string
  error_description?: string
  token?: string
  nickname?: string
  avatar?: string
}

export interface AuthCallbackBody extends AuthCallbackQuery {
  tickets?: Record<string, string>
}

export interface AuthCallbackSession {
  id: string
  authExtras?: Record<string, unknown>
}

export interface CredentialResult {
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
  tokenType?: string
  platformUid?: string
  profile?: PlatformAccountProfile
  selectableAccounts?: PlatformSelectableAccount[]
  callbackResponseType?: AuthCallbackResponseType
  raw?: unknown
}

export interface CredentialContext {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
  platformUid?: string
  account?: string
}

export interface PlatformAccountProfile {
  platformUid: string
  account?: string
  displayName: string
  avatarUrl?: string
  email?: string
  fansCount?: number
  followingCount?: number
  raw?: unknown
}

export interface PlatformSelectableAccount {
  platform: AccountType
  platformUid: string
  account?: string
  displayName: string
  avatarUrl?: string
  parentPlatformUid?: string
  fansCount?: number
  followingCount?: number
  credential?: PlatformAccountCredentialSnapshot
  profile?: Record<string, unknown>
  raw?: unknown
}

export interface PlatformAccountCredentialSnapshot {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export interface RefreshCredentialInput {
  accessToken: string
  refreshToken?: string
}

export interface RevokeCredentialInput {
  accessToken: string
  refreshToken?: string
  platformUid?: string
}

export interface RefreshAccountAccessInput {
  rootAccessToken: string
  rootRefreshToken?: string
  platformUid: string
}

export interface AuthProvider {
  generateAuthUrl: (input: GenerateAuthUrlInput) => Promise<GenerateAuthUrlResult>
  exchangeCode: (input: AuthCallbackInput) => Promise<CredentialResult>
  refresh: (input: RefreshCredentialInput) => Promise<CredentialResult>
  revoke?: (input: RevokeCredentialInput) => Promise<void>
  getProfile: (input: CredentialContext) => Promise<PlatformAccountProfile>
  listSelectableAccounts?: (input: CredentialContext) => Promise<PlatformSelectableAccount[]>
  refreshAccountAccess?: (input: RefreshAccountAccessInput) => Promise<PlatformSelectableAccount>
}

// ── Publish ──

export interface TopicCapability {
  supported: boolean
  nativeField?: boolean
  maxCount?: number
  maxTotalLength?: number
}

export interface PlatformMediaRules {
  imageFormats?: string[]
  videoFormats?: string[]
  maxImageSize?: number
  maxVideoSize?: number
  minVideoDuration?: number
  maxVideoDuration?: number
  minImageWidth?: number
  minImageHeight?: number
  maxImageWidth?: number
  maxImageHeight?: number
  aspectRatio?: { min?: number, max?: number }
}

export interface PublishMediaInput {
  url: string
  metadata?: PublishMediaMetadata
  options?: PublishMediaOptions
}

export interface PublishCoverInput {
  url: string
  metadata?: PublishMediaMetadata
  options?: PublishMediaOptions
}

export interface PublishContentInput {
  title?: string
  body?: string
  media: PublishMediaInput[]
  cover?: PublishCoverInput
}

export interface PublishValidateInput<TOption = Record<string, unknown>> {
  platform: AccountType
  accountId: string
  content: PublishContentInput
  option?: TOption
}

export interface PublishValidationResult {
  valid: boolean
  issues?: PublishValidationIssue[]
}

export interface PublishNormalizeInput<TOption = Record<string, unknown>> {
  platform: AccountType
  accountId: string
  content: PublishContentInput
  option?: TOption
}

export interface NormalizedPublishTask<TOption = Record<string, unknown>> {
  content: PublishContentInput
  option?: TOption
  mediaJobs?: PublishMediaJob[]
}

export interface PublishMediaJob {
  mediaId: string
  type: PublishMediaType
  url: string
  metadata?: PublishMediaMetadata
}

export enum PublishMediaType {
  Image = 'image',
  Video = 'video',
}

export interface PublishMediaMetadata {
  type?: PublishMediaType
  durationSec?: number
  width?: number
  height?: number
  codec?: string
  format?: string
  sizeBytes?: number
}

export interface PublishMediaOptions {
  adaptation?: PublishMediaAdaptationOption
}

export interface PublishPublishInput<TOption = Record<string, unknown>> {
  taskId: string
  platform: AccountType
  accountId: string
  content: PublishContentInput
  option?: TOption
  publishAt?: Date
  credential: CredentialContext
}

export interface PublishProviderResult<TDataOption = Record<string, unknown>> {
  status: number
  platformWorkId?: string
  permalink?: string
  shortLink?: string
  errorMessage?: string
  originalWorkLink?: string
  workStatus?: WorkStatus
  linkStatus?: PublishRecordLinkStatus
  linkMeta?: Record<string, unknown>
  userAction?: PublishUserAction
  mediaJobs?: PublishMediaJob[]
  dataOption?: TDataOption
}

export interface PublishUserAction {
  schema?: string
  shortLink?: string
  expiresAt: Date
  data?: Record<string, unknown>
}

export interface PublishFinalizeInput<TDataOption = Record<string, unknown>, TOption = Record<string, unknown>> {
  taskId: string
  platform: AccountType
  platformWorkId: string
  mediaJobs: PublishMediaJob[]
  option?: TOption
  dataOption?: TDataOption
  credential: CredentialContext
}

export interface PublishVerifyInput<TDataOption = Record<string, unknown>, TOption = Record<string, unknown>> {
  taskId: string
  platform: AccountType
  platformWorkId: string
  option?: TOption
  dataOption?: TDataOption
  credential: CredentialContext
}

export interface PublishVerifyResult {
  published: boolean
  permalink?: string
  platformWorkId?: string
  linkStatus?: PublishRecordLinkStatus
  linkMeta?: Record<string, unknown>
}

export interface PublishCancelInput {
  taskId: string
  platform: AccountType
  platformWorkId: string
  credential: CredentialContext
}

export interface PublishCancelResult {
  canceled: boolean
}

export interface PublishUpdateInput<TOption = Record<string, unknown>> {
  taskId: string
  platform: AccountType
  platformWorkId: string
  content: PublishContentInput
  option?: TOption
  credential: CredentialContext
}

export interface PublishProvider<TOption = Record<string, unknown>, TDataOption = Record<string, unknown>> {
  readonly platform: AccountType

  validate: (input: PublishValidateInput<TOption>) => Promise<PublishValidationResult>
  normalize: (input: PublishNormalizeInput<TOption>) => Promise<NormalizedPublishTask<TOption>>
  publish: (input: PublishPublishInput<TOption>) => Promise<PublishProviderResult<TDataOption>>
  resolveMediaRules?: (input: PublishValidateInput<TOption>) => PlatformMediaRules
  finalize?: (input: PublishFinalizeInput<TDataOption, TOption>) => Promise<PublishProviderResult<TDataOption>>
  verify?: (input: PublishVerifyInput<TDataOption, TOption>) => Promise<PublishVerifyResult>
  cancel?: (input: PublishCancelInput) => Promise<PublishCancelResult>
  update?: (input: PublishUpdateInput<TOption>) => Promise<PublishProviderResult<TDataOption>>
}

export enum PublishOptionValueType {
  List = 'list',
  Tree = 'tree',
}

export interface PublishOptionSource {
  field: string
  label: string
  description?: string
  valueType: PublishOptionValueType
  requiresAccount: boolean
  filterSchema?: z.ZodTypeAny
  createSchema?: z.ZodTypeAny
}

export type PublishOptionFilterValue = string | number | boolean | Date | null | undefined
export type PublishOptionFilters = Record<string, PublishOptionFilterValue | PublishOptionFilterValue[]>
export type PublishOptionJsonSchemaView = z.core.JSONSchema.BaseSchema

export interface PublishOptionValuesInput {
  userId: string
  accountId: string
  field: string
  filters?: Record<string, unknown>
  credential: CredentialContext
}

export interface PublishOptionValueItem {
  value: string
  label: string
  description?: string
  disabled?: boolean
  children?: PublishOptionValueItem[]
  extra?: Record<string, unknown>
}

export interface PublishOptionValuesResult {
  field: string
  valueType: PublishOptionValueType
  items: PublishOptionValueItem[]
}

export interface PublishOptionCreateInput {
  userId: string
  accountId: string
  field: string
  data?: Record<string, unknown>
  credential: CredentialContext
}

export interface PublishOptionCreateResult {
  field: string
  valueType: PublishOptionValueType
  item: PublishOptionValueItem
}

export interface PublishOptionSourceProvider {
  listSources: () => PublishOptionSource[]
  getValues: (input: PublishOptionValuesInput) => Promise<PublishOptionValuesResult>
  createValue?: (input: PublishOptionCreateInput) => Promise<PublishOptionCreateResult>
}

// ── Analytics ──

export interface ChannelSnapshotTime {
  snapshotAt: Date
  fetchedAt?: Date
  periodStartAt?: Date
  periodEndAt?: Date
}

export interface ChannelAccountProfileSnapshot {
  displayName?: string
  username?: string
  avatarUrl?: string
  accountType?: string
}

export interface ChannelAccountMetricsSnapshot {
  fansCount?: number
  followingCount?: number
  workCount?: number
  readCount?: number
  viewCount?: number
  impressionCount?: number
  reachCount?: number
  likeCount?: number
  collectCount?: number
  forwardCount?: number
  commentCount?: number
  clickCount?: number
  engagementCount?: number
}

export interface ChannelWorkSnapshot {
  id: string
  url?: string
  title?: string
  description?: string
  mediaType?: string
  coverUrl?: string
  publishedAt?: Date
  status?: string
  author?: string
}

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

export interface ChannelAccountDataSnapshotPayload extends ChannelSnapshotTime {
  platformUid?: string
  profile?: ChannelAccountProfileSnapshot
  metrics?: ChannelAccountMetricsSnapshot
  extra?: Record<string, unknown>
  rawResponse?: unknown
}

export interface ChannelWorkDataSnapshotPayload extends ChannelSnapshotTime {
  platformWorkId?: string
  work: ChannelWorkSnapshot
  metrics?: ChannelWorkMetricsSnapshot
  extra?: Record<string, unknown>
  rawResponse?: unknown
}

export interface ChannelAccountAnalyticsResult {
  snapshots: ChannelAccountDataSnapshotPayload[]
  profile?: ChannelAccountProfileSnapshot
  metrics?: ChannelAccountMetricsSnapshot
  extra?: Record<string, unknown>
  rawResponse?: unknown
}

export interface ChannelWorkAnalyticsResult {
  snapshots: ChannelWorkDataSnapshotPayload[]
  work?: ChannelWorkSnapshot
  metrics?: ChannelWorkMetricsSnapshot
  extra?: Record<string, unknown>
  rawResponse?: unknown
}

export interface ChannelWorkDataResult<TExtra = Record<string, unknown>> {
  snapshots: ChannelWorkDataSnapshotPayload[]
  work?: ChannelWorkSnapshot
  metrics?: ChannelWorkMetricsSnapshot
  extra?: TExtra
  rawResponse?: unknown
}

export enum ChannelPaginationMode {
  Cursor = 'cursor',
  Page = 'page',
  None = 'none',
}

export enum ChannelPaginationDirection {
  Next = 'next',
  Previous = 'previous',
}

export interface ChannelPaginationInput {
  cursor?: string
  limit?: number
  direction?: ChannelPaginationDirection
  page?: number
  pageSize?: number
}

export interface ChannelCursorPaginationResult {
  mode: ChannelPaginationMode.Cursor
  nextCursor?: string
  previousCursor?: string
  hasNext: boolean
  hasPrevious: boolean
  limit: number
}

export interface ChannelPagePaginationResult {
  mode: ChannelPaginationMode.Page
  page: number
  pageSize: number
  total?: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ChannelNonePaginationResult {
  mode: ChannelPaginationMode.None
}

export type ChannelPaginationResult
  = | ChannelCursorPaginationResult
    | ChannelPagePaginationResult
    | ChannelNonePaginationResult

export interface ChannelCursorPaginationMetadata {
  mode: ChannelPaginationMode.Cursor
  defaultLimit: number
  maxLimit: number
  supportsPrevious: boolean
}

export interface ChannelPagePaginationMetadata {
  mode: ChannelPaginationMode.Page
  defaultPageSize: number
  maxPageSize: number
  supportsTotal: boolean
}

export interface ChannelNonePaginationMetadata {
  mode: ChannelPaginationMode.None
}

export type ChannelPaginationMetadata
  = | ChannelCursorPaginationMetadata
    | ChannelPagePaginationMetadata
    | ChannelNonePaginationMetadata

export interface ChannelWorkListItem {
  platformWorkId: string
  contentMode: PublishContentMode
  title?: string
  description?: string
  url?: string
  coverUrl?: string
  publishedAt?: Date
  authorName?: string
  authorPlatformUid?: string
  status?: string
  metrics?: ChannelWorkMetricsSnapshot
}

export interface ChannelWorkListResult {
  items: ChannelWorkListItem[]
  pagination: ChannelPaginationResult
}

export interface AnalyticsAccountInput {
  accountId: string
  platform: AccountType
  credential: CredentialContext
  since?: Date
  until?: Date
}

export interface AnalyticsWorkInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
  since?: Date
  until?: Date
}

export interface AnalyticsProvider {
  fetchAccountAnalytics: (input: AnalyticsAccountInput) => Promise<ChannelAccountAnalyticsResult>
  fetchWorkAnalytics?: (input: AnalyticsWorkInput) => Promise<ChannelWorkAnalyticsResult>
}

// ── Engagement ──

export interface EngagementCommentInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
  content: string
  replyToId?: string
}

export interface EngagementLikeInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
}

export interface EngagementQuoteInput extends EngagementLikeInput {
  content: string
}

export interface EngagementCommentActionInput {
  accountId: string
  commentId: string
  platform: AccountType
  credential: CredentialContext
}

export interface EngagementAccountActionInput {
  accountId: string
  targetPlatformUid: string
  platform: AccountType
  credential: CredentialContext
}

export enum ChannelEngagementActionType {
  Comment = 'comment',
  Reply = 'reply',
  DeleteComment = 'delete_comment',
  Like = 'like',
  Unlike = 'unlike',
  Repost = 'repost',
  UndoRepost = 'undo_repost',
  Quote = 'quote',
  Bookmark = 'bookmark',
  RemoveBookmark = 'remove_bookmark',
  HideReply = 'hide_reply',
  UnhideReply = 'unhide_reply',
  Follow = 'follow',
  Unfollow = 'unfollow',
}

export enum ChannelEngagementFunctionName {
  DeleteComment = 'delete_comment',
  Like = 'like',
  Unlike = 'unlike',
  Repost = 'repost',
  UndoRepost = 'undo_repost',
  Quote = 'quote',
  Bookmark = 'bookmark',
  RemoveBookmark = 'remove_bookmark',
  HideReply = 'hide_reply',
  UnhideReply = 'unhide_reply',
  Follow = 'follow',
  Unfollow = 'unfollow',
}

export enum ChannelEngagementTargetType {
  Work = 'work',
  Comment = 'comment',
  Account = 'account',
}

export interface ChannelComment {
  platformCommentId: string
  platformWorkId?: string
  parentCommentId?: string
  authorName?: string
  authorPlatformUid?: string
  content: string
  createdAt?: Date
  likeCount?: number
  replyCount?: number
}

export interface ChannelCommentListResult {
  items: ChannelComment[]
  pagination: ChannelPaginationResult
}

export interface ChannelEngagementActionResult {
  actionType: ChannelEngagementActionType
  targetType: ChannelEngagementTargetType
  targetId: string
  platformActionId?: string
  success: boolean
  createdAt?: Date
}

export interface EngagementProvider {
  readonly commentPagination: ChannelPaginationMetadata
  listComments?: (input: EngagementListInput) => Promise<ChannelCommentListResult>
  createComment?: (input: EngagementCommentInput) => Promise<ChannelEngagementActionResult>
  deleteComment?: (input: EngagementDeleteInput) => Promise<ChannelEngagementActionResult>
  like?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  unlike?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  repost?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  undoRepost?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  quote?: (input: EngagementQuoteInput) => Promise<ChannelEngagementActionResult>
  bookmark?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  removeBookmark?: (input: EngagementLikeInput) => Promise<ChannelEngagementActionResult>
  hideReply?: (input: EngagementCommentActionInput) => Promise<ChannelEngagementActionResult>
  unhideReply?: (input: EngagementCommentActionInput) => Promise<ChannelEngagementActionResult>
  follow?: (input: EngagementAccountActionInput) => Promise<ChannelEngagementActionResult>
  unfollow?: (input: EngagementAccountActionInput) => Promise<ChannelEngagementActionResult>
}

export interface EngagementListInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
  pagination: ChannelPaginationInput
}

export interface EngagementDeleteInput {
  accountId: string
  commentId: string
  platform: AccountType
  credential: CredentialContext
}

// ── Browse ──

export interface BrowseSearchInput {
  accountId: string
  platform: AccountType
  credential: CredentialContext
  query: string
  cursor?: string
  limit?: number
}

export interface BrowseDetailInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
}

export interface BrowseProvider {
  search?: (input: BrowseSearchInput) => Promise<unknown>
  getDetail?: (input: BrowseDetailInput) => Promise<unknown>
}

// ── Work ──

export interface WorkLinkInfoInput {
  accountId?: string
  platform: AccountType
  credential?: CredentialContext
  link: string
  dataId?: string
}

export interface WorkDetailInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
}

export interface WorkOwnershipInput {
  accountId: string
  platformWorkId: string
  platform: AccountType
  credential: CredentialContext
}

export interface WorkListInput {
  accountId: string
  platform: AccountType
  credential: CredentialContext
  pagination: ChannelPaginationInput
}

export interface WorkProvider {
  readonly listWorksPagination?: ChannelPaginationMetadata
  requiresCredentialForLinkInfo?: boolean
  listWorks?: (input: WorkListInput) => Promise<ChannelWorkListResult>
  getLinkInfo?: (input: WorkLinkInfoInput) => Promise<ChannelWorkDataResult>
  getDetail?: (input: WorkDetailInput) => Promise<ChannelWorkDataResult>
  verifyOwnership?: (input: WorkOwnershipInput) => Promise<boolean>
}

// ── Webhook ──

export interface PlatformWebhookContext {
  platform: AccountType
}

export interface PlatformWebhookHandler {
  handle: (request: Request, response: Response, context: PlatformWebhookContext) => Promise<void>
}

export interface RawBodyRequest extends Request {
  rawBody?: Buffer
}

// ── Metadata ──

export interface PlatformContentLimits {
  modes: PublishContentMode[]
  maxTitleLength?: number
  maxBodyLength?: number
  maxTotalTextLength?: number
  maxMediaCount?: number
  maxImages?: number
  maxVideos?: number
}

export interface PlatformPublishPolicy {
  completionStrategy: CompletionStrategy
  scheduleByPlatform: boolean
  updateSupported: boolean
}

export interface PlatformEmptyAccountHint {
  title: Record<Locale, string>
  description: Record<Locale, string>
  action?: {
    label: Record<Locale, string>
    url: string
  }
}

export enum ChannelWorkAnalyticsDataSource {
  Official = 'official',
  PostInsightCrawler = 'post_insight_crawler',
}

export interface PlatformWorkAnalyticsMetadata {
  dataSources: ChannelWorkAnalyticsDataSource[]
}

export interface PlatformAnalyticsMetadata {
  work?: PlatformWorkAnalyticsMetadata
}

export interface PlatformMetadata {
  platform: AccountType
  displayName: Record<Locale, string>
  logoUrl: string
  authType: AuthType
  authInstructions?: Record<Locale, string>
  emptyAccountHint?: PlatformEmptyAccountHint
  editor: EditorType
  contentLimits: PlatformContentLimits
  mediaRules: PlatformMediaRules
  topic: TopicCapability
  publishPolicy?: PlatformPublishPolicy
  optionSchema: z.ZodTypeAny
  defaultOption?: Record<string, unknown>
  analytics?: PlatformAnalyticsMetadata
}

export interface PlatformStaticMetadata extends Omit<PlatformMetadata, 'logoUrl'> {}

export interface PlatformAuthCapabilities {
  supported: boolean
  revoke: boolean
  selectableAccounts: boolean
  refreshAccountAccess: boolean
}

export interface PlatformPublishCapabilities {
  supported: boolean
  cancel: boolean
  update: boolean
  verify: boolean
  finalize: boolean
  scheduleByPlatform: boolean
  optionSources: boolean
  completionStrategy?: CompletionStrategy
}

export interface PlatformAnalyticsCapabilities {
  account: boolean
  work: boolean
}

export interface ChannelEngagementOperationParameters {
  querySchema: PublishOptionJsonSchemaView
  bodySchema?: PublishOptionJsonSchemaView
  dataSchema?: PublishOptionJsonSchemaView
}

export interface PlatformEngagementCommentCapabilities {
  list: {
    supported: boolean
    pagination: ChannelPaginationMetadata
    parameters: ChannelEngagementOperationParameters
  }
  create: {
    supported: boolean
    parameters: ChannelEngagementOperationParameters
  }
}

export interface PlatformEngagementFunctionCapabilities {
  name: ChannelEngagementFunctionName
  label: Record<Locale, string>
  target: ChannelEngagementTargetType
  parameters: Required<ChannelEngagementOperationParameters>
}

export interface PlatformEngagementCapabilities {
  comments: PlatformEngagementCommentCapabilities
  functions: PlatformEngagementFunctionCapabilities[]
}

export interface PlatformWorkCapabilities {
  listWorks: boolean
  listWorksPagination: ChannelPaginationMetadata
  getLinkInfo: boolean
  getDetail: boolean
  verifyOwnership: boolean
}

export interface PlatformBrowseCapabilities {
  search: boolean
  getDetail: boolean
}

export interface PlatformWebhookCapabilities {
  supported: boolean
}

export interface PlatformCapabilities {
  auth: PlatformAuthCapabilities
  publish: PlatformPublishCapabilities
  analytics: PlatformAnalyticsCapabilities
  engagement: PlatformEngagementCapabilities
  work: PlatformWorkCapabilities
  browse: PlatformBrowseCapabilities
  webhook: PlatformWebhookCapabilities
}

export enum PlatformStatus {
  Hidden = 'hidden',
  Available = 'available',
  Unavailable = 'unavailable',
  ComingSoon = 'coming_soon',
}

export interface CachedPlatformMetadata extends Omit<PlatformMetadata, 'optionSchema'> {
  status: PlatformStatus
  capabilities: PlatformCapabilities
  optionSchema: Record<string, unknown>
}

// ── Runtime Policy ──

export interface PlatformMediaPolicy {
  imageConvertFormat?: string
  maxImageWidth?: number
  maxImageHeight?: number
  imageQuality?: number
  videoMaxDuration?: number
  videoMaxBitrate?: number
  generateCover?: boolean
}

export interface PlatformRetryPolicy {
  maxRetries?: number
  backoffMs?: number
  backoffMultiplier?: number
}

export interface PlatformRuntimePolicy {
  concurrency?: number
  scheduleWindow?: number
  publishTimeout?: number
  userActionTimeout?: number
  finalizeTimeout?: number
  webhookTimeout?: number
  refreshWait?: number
  refreshBeforeExpiry?: number
  backgroundRefresh?: boolean
  media?: PlatformMediaPolicy
  retry?: PlatformRetryPolicy
}

// ── Platform Integration ──

export interface PlatformIntegration<TOption = Record<string, unknown>, TDataOption = Record<string, unknown>> {
  readonly platform: AccountType
  readonly metadata: PlatformMetadata
  readonly status?: PlatformStatus
  readonly runtime: PlatformRuntimePolicy
  readonly auth?: AuthProvider
  readonly publish?: PublishProvider<TOption, TDataOption>
  readonly publishOptions?: PublishOptionSourceProvider
  readonly analytics?: AnalyticsProvider
  readonly engagement?: EngagementProvider
  readonly browse?: BrowseProvider
  readonly work?: WorkProvider
  readonly webhook?: PlatformWebhookHandler
}

// ── Error ──

export interface PublishTaskError {
  category: PlatformErrorCategory
  code?: string
  message: string
  originalData?: unknown
  retryable: boolean
  occurredAt: Date
}
