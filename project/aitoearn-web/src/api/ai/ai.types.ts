import type { CreditsScope } from '../_shared/credits.types'
import type { AgentTaskStatus, MediaType } from './ai.constants'
import type { PlatType } from '@/app/config/platConfig'

// Source: types/ai.ts

/**
 * ChatModel 类型。
 */
export interface ChatModel {
  name: string
  description?: string
  logo?: string
  channel?: string
  scenes?: string[]
  inputModalities?: string[]
  outputModalities?: string[]
  pricing?: ChatModelPricing
  fixedImagePricing?: ChatModelFixedImagePricing[]
  tags?: string[]
  mainTag?: boolean
}

/**
 * ChatModelPricingTier 类型。
 */
export interface ChatModelPricingTier {
  maxInputTokens?: number
  input?: Record<string, string>
  output?: Record<string, string>
}

/**
 * ChatModelPricing 类型。
 */
export interface ChatModelPricing {
  prompt?: string
  completion?: string
  tiers?: ChatModelPricingTier[]
  originPricing?: {
    tiers?: ChatModelPricingTier[]
  }
}

/**
 * ChatModelFixedImagePricing 类型。
 */
export interface ChatModelFixedImagePricing {
  resolution: string
  price: number
}

/**
 * AdaptPlatform 类型。
 */
export type AdaptPlatform
  = | 'douyin' | 'xhs' | 'wxSph' | 'KWAI' | 'youtube' | 'wxGzh' | 'bilibili' | 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'threads' | 'pinterest' | 'linkedin'

// Source: types/draftGeneration.ts

/**
 * CreateDraftFromVideoUrlDto 请求参数。
 */
export interface CreateDraftFromVideoUrlDto {
  videoUrl: string
  groupId?: string
  platforms?: string[]
}

/**
 * CreateDraftFromVideoUrlVo 响应数据。
 */
export interface CreateDraftFromVideoUrlVo {
  materialId: string
}

/**
 * ImageModelPricing 类型。
 */
export interface ImageModelPricing {
  resolution: string
  pricePerImage: number
  originPrice?: number
}

/**
 * ImageModelInfo 数据结构。
 */
export interface ImageModelInfo {
  model: string
  displayName: string
  pricing: ImageModelPricing[]
  supportedAspectRatios?: string[]
  maxInputImages?: number
  tags?: string[]
}

/**
 * VideoModelPricing 类型。
 */
export interface VideoModelPricing {
  duration: number
  price: number
  mode?: string
  resolution?: string
  aspectRatio?: string
  discount?: string
  originPrice?: number
}

/**
 * VideoModelInputConstraint 类型。
 */
export interface VideoModelInputConstraint {
  maxCount?: number
  formats?: string[]
  minDuration?: number
  maxDuration?: number
  maxTotalDuration?: number
  maxSizeMb?: number
  minAspectRatio?: number
  maxAspectRatio?: number
  minWidth?: number
  maxWidth?: number
  minPixels?: number
  maxPixels?: number
  minFps?: number
  maxFps?: number
}

/**
 * VideoModelInputConstraints 类型。
 */
export interface VideoModelInputConstraints {
  images?: VideoModelInputConstraint
  videos?: VideoModelInputConstraint
  audios?: VideoModelInputConstraint
}

/**
 * VideoModelInfo 数据结构。
 */
export interface VideoModelInfo {
  name: string
  description: string
  channel: string
  creditsScope?: CreditsScope
  modes: string[]
  resolutions: string[]
  durations: number[]
  maxInputImages: number
  inputConstraints?: VideoModelInputConstraints
  aspectRatios: string[]
  tags: string[]
  defaults: {
    resolution?: string
    aspectRatio?: string
    duration?: number
  }
  pricing: VideoModelPricing[]
}

/**
 * DraftGenerationPricingVo 响应数据。
 */
export interface DraftGenerationPricingVo {
  imageModels: ImageModelInfo[]
  videoModels?: VideoModelInfo[]
}

// Source: ai/ai.api.ts inline types
// Source: agent.ts

/**
 * Media 类型。
 */
export interface Media {
  type: MediaType
  url: string
  coverUrl?: string // 视频封面URL（可选）
}

/**
 * TaskDetail 数据结构。
 */
export interface TaskDetail {
  id: string
  userId: string
  prompt: string
  title: string
  description: string
  tags: string[]
  status: AgentTaskStatus
  medias: Media[]
  errorMessage: string
  createdAt: string
  updatedAt: string
  messages?: TaskMessage[]
  rating?: number | null
  ratingComment?: string | null

  favoritedAt?: string | null
}

/**
 * TaskMessage 类型。
 */
export interface TaskMessage {
  type: 'user' | 'assistant' | 'result' | 'system' | 'stream_event' | 'error'
  uuid?: string
  message?: any
  content?: string | any[]
  parent_tool_use_id?: string | null
  subtype?: string
  code?: number
}

/**
 * TaskListItem 数据结构。
 */
export interface TaskListItem
{
  id: string
  userId: string

  title?: string

  createdAt: string

  updatedAt: string

  status?: string

  rating?: number | null

  ratingComment?: string | null

  favoritedAt?: string | null
}

/**
 * TaskListResponse 响应数据。
 */
export interface TaskListResponse {

  page: number
  pageSize: number
  totalPages: number
  total: number
  list: TaskListItem[]
}

/**
 * GetTaskListParams 请求参数。
 */
export interface GetTaskListParams {
  page?: number
  pageSize?: number

  keyword?: string

  favoriteOnly?: boolean
}

/**
 * CreateAgentTaskParams 请求参数。
 */
export interface CreateAgentTaskParams {
  prompt: string | any[] // 支持字符串或 Claude Prompt 格式数组
  taskId?: string // 可选，传入则继续上一次对话
  messageUuid?: string // 可选，重置到对应的消息继续
  includePartialMessages?: boolean // 使用流式消息
}

/**
 * CreateTaskResponse 响应数据。
 */
export interface CreateTaskResponse {
  id: string
}

/**
 * ResultType 类型。
 */
export type ResultType = 'imageOnly' | 'videoOnly' | 'fullContent'

/**
 * ResultAction 类型。
 */
export type ResultAction
  = | 'draft' | 'publish' | 'createChannel' | 'updateChannel'
    | 'loginChannel' | 'platformNotSupported'

/**
 * Platform 类型。
 */
export type Platform
  = | 'douyin' | 'xhs' | 'wxSph' | 'KWAI' | 'youtube' | 'wxGzh' | 'bilibili' | 'twitter' | 'tiktok' | 'facebook' | 'instagram' | 'threads' | 'pinterest' | 'linkedin'

/**
 * ResultData 数据结构。
 */
export interface ResultData {
  taskId: string
  title: string
  description: string
  tags: string[]
  medias: Media[]
  type?: ResultType // 结果类型
  action?: ResultAction // 操作类型
  platform?: Platform // 平台类型
  accountType?: string[] // 账户类型数组，如 ['douyin', 'xhs']
}

/**
 * ResultMessage 类型。
 */
export interface ResultMessage {
  type: 'result'
  subtype?: string // 保留兼容性
  uuid: string
  duration_ms: number
  duration_api_ms: number
  is_error: boolean
  num_turns: number
  message: string
  result: ResultData
  total_cost_usd: number
  usage: any
  permission_denials: any[]
}

/**
 * StreamEvent 类型。
 */
export interface StreamEvent {
  type: 'stream_event'
  uuid: string
  event: {
    type:
      | 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'
    index?: number
    content_block?: any
    delta?: {
      type: 'text_delta' | 'input_json_delta'
      text?: string
      partial_json?: string
    }
    message?: any
    usage?: any
  }
  parent_tool_use_id?: string | null
}

/**
 * SSEMessage 类型。
 */
export interface SSEMessage {
  type:
    | 'init' | 'keep_alive' | 'stream_event' | 'message' | 'status' | 'error' | 'done' | 'text' | 'result'
  taskId?: string
  message?: string | ResultMessage | StreamEvent
  sessionId?: string
  status?: AgentTaskStatus
  data?: any
}

/**
 * TaskMessagesVo 响应数据。
 */
export interface TaskMessagesVo {
  messages: TaskMessage[]
  status?: AgentTaskStatus // 任务状态，可选
}

// Source: draftGeneration.ts
// ==================== 类型定义 ====================

/**
 * 草稿生成任务状态。
 */
export type DraftTaskStatus = 'generating' | 'success' | 'failed'

/**
 * DraftGenerationResponse 响应数据。
 */
export interface DraftGenerationResponse {
  materialId?: string
  mediaId?: string
  mediaIds?: string[]
  title?: string
  description?: string
  topics?: string[]
  videoUrl?: string
  coverUrl?: string
  imageUrls?: string[]
  requestedImageCount?: number
  generatedImageCount?: number
  imageGenerationErrors?: Array<Record<string, unknown>>
  plan?: Record<string, unknown>
}

/**
 * DraftGenerationRequest 请求参数。
 */
export interface DraftGenerationRequest {
  groupId?: string
  model?: string
  imageModel?: string
  plannerModel?: string
  duration?: number
  resolution?: string
  aspectRatio?: string
  prompt?: string
  captionPrompt?: string
  imageUrls?: string[]
  videoUrls?: string[]
  audioUrls?: string[]
  imageCount?: number
  imageSize?: string
  platforms?: PlatType[]
  draftType?: VideoDraftType | ImageTextDraftType
}

/**
 * DraftGenerationQueue 类型。
 */
export interface DraftGenerationQueue {
  position?: number
  waitingCount?: number
}

/**
 * DraftGenerationTask 类型。
 */
export interface DraftGenerationTask {
  id: string
  status: DraftTaskStatus
  points: number
  errorMessage?: string
  request?: DraftGenerationRequest
  response?: DraftGenerationResponse | string
  queue?: DraftGenerationQueue
  createdAt: string
  updatedAt: string
}

/**
 * DraftGenerationStats 数据结构。
 */
export interface DraftGenerationStats {
  generatingCount: number
}

/**
 * CreateDraftGenerationVo 响应数据。
 */
export interface CreateDraftGenerationVo {
  taskIds: string[]
}

/**
 * DraftGenerationTaskListVo 响应数据。
 */
export interface DraftGenerationTaskListVo {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: DraftGenerationTask[]
}

// ==================== API 调用 ====================

/**
 * 视频生成模型类型标识。
 */
export type VideoModelType = string

/**
 * ImageModelType 类型。
 */
export type ImageModelType = string

/**
 * DraftContentType 类型。
 */
export type DraftContentType = 'video' | 'image_text'

/**
 * VideoDraftType 类型。
 */
export type VideoDraftType = 'draft' | 'video'

/**
 * ImageTextDraftType 类型。
 */
export type ImageTextDraftType = 'draft' | 'image'

/**
 * Agent 任务评分数据。
 */
export interface AgentTaskRatingData {
  rating?: number | null
  comment?: string | null
}

/**
 * Agent 任务评分响应。
 */
export interface AgentTaskRatingResponse {
  data: AgentTaskRatingData
}

/**
 * 提交 Agent 任务评分请求参数。
 */
export interface SubmitAgentTaskRatingPayload {
  rating: number
  comment?: string
}

/**
 * Agent 任务公开分享响应。
 */
export interface AgentTaskShareVo {
  token: string
  expiresAt: string
  urlPath: string
}

/**
 * AI 分页查询参数。
 */
export interface AiPaginationParams {
  page?: number
  pageSize?: number
}

/**
 * 视频生成历史时间戳。
 */
export type VideoGenerationTimestamp = number | string | null | undefined

/**
 * 视频生成历史记录项。
 */
export interface VideoGenerationHistoryItem {
  task_id: string
  action: string
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING' | string
  fail_reason?: string
  submit_time?: VideoGenerationTimestamp
  start_time?: VideoGenerationTimestamp
  finish_time?: VideoGenerationTimestamp
  progress: string
  prompt: string
  data?: {
    completed_at?: VideoGenerationTimestamp
    created_at?: VideoGenerationTimestamp
    error?: string | null
    id?: string
    model?: string
    object?: string
    progress?: number
    result_url?: string
    seconds?: string
    size?: string
    status?: string
    url?: string
    video_url?: string
  }
}

/**
 * 视频生成历史列表响应数据。
 */
export interface VideoGenerationHistoryListVo {
  list?: VideoGenerationHistoryItem[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

/**
 * AI 日志查询参数。
 */
export interface AiLogListParams extends AiPaginationParams {
  startDate?: string
  endDate?: string
}

/**
 * AI 聊天消息。
 */
export interface AiChatMessage {
  role: string
  content: string
}

/**
 * AI 聊天请求参数。
 */
export interface AiChatStreamParams {
  messages: AiChatMessage[]
  stream?: boolean
  model?: string
  temperature?: number
  presence_penalty?: number
  frequency_penalty?: number
  top_p?: number
  max_tokens?: number
}

/**
 * AI 视频草稿批量生成请求参数。
 */
export interface CreateVideoDraftGenerationParams {
  quantity: number
  groupId: string
  model: VideoModelType
  prompt?: string
  captionPrompt?: string
  imageUrls?: string[]
  videoUrls?: string[]
  audioUrls?: string[]
  duration?: number
  resolution?: string
  aspectRatio?: string
  platforms?: PlatType[]
  draftType?: VideoDraftType
}

/**
 * AI 图文草稿批量生成请求参数。
 */
export interface CreateImageTextDraftGenerationParams {
  quantity: number
  groupId: string
  prompt: string
  captionPrompt?: string
  imageModel: ImageModelType
  imageCount?: number
  imageUrls?: string[]
  aspectRatio?: string
  imageSize?: string
  platforms?: PlatType[]
  draftType?: ImageTextDraftType
}
