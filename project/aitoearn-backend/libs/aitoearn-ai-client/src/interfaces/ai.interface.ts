import { Pagination, PaginationVo, UserType } from '@yikart/common'

// Models Config interfaces
export interface ModelsConfigVo {
  chat: Array<ChatModelConfigVo>
  image: {
    generation: Array<ImageGenerationModelParamsVo>
    edit: Array<ImageEditModelParamsVo>
  }
  video: {
    generation: Array<VideoGenerationModelParamsVo>
  }
}

export interface ModelsConfigDto {
  chat: Array<ChatModelConfigVo>
  image: {
    generation: Array<ImageGenerationModelParamsVo>
    edit: Array<ImageEditModelParamsVo>
  }
  video: {
    generation: Array<VideoGenerationModelParamsVo>
  }
}

export enum AiLogType {
  Chat = 'chat',
  Image = 'image',
  /** @deprecated Removed feature, kept for backward compatibility */
  Card = 'card',
  Video = 'video',
}

export enum AiLogStatus {
  Generating = 'generating',
  Success = 'success',
  Failed = 'failed',
}

export enum AiLogChannel {
  NewApi = 'new-api',
  /** @deprecated Removed feature, kept for backward compatibility */
  Md2Card = 'md2card',
  /** @deprecated Removed feature, kept for backward compatibility */
  FireflyCard = 'fireflyCard',
  /** @deprecated Removed feature, kept for backward compatibility */
  Kling = 'kling',
  Volcengine = 'volcengine',
  /** @deprecated Removed feature, kept for backward compatibility */
  Dashscope = 'dashscope',
  /** @deprecated Removed feature, kept for backward compatibility */
  Sora2 = 'sora2',
}

// Image DTO 接口
export interface ImageGenerationDto {
  prompt: string
  model?: string
  n?: number
  quality?: string
  response_format?: string
  size?: string
  style?: string
  user?: string
}

export interface ImageEditDto {
  model?: string
  image: string | string[]
  prompt: string
  mask?: string
  n?: number
  size?: string
  response_format?: string
  user?: string
}

// User Image DTO 接口
export interface UserImageGenerationDto extends ImageGenerationDto {
  userId: string
  userType: UserType
}

export interface UserImageEditDto extends ImageEditDto {
  userId: string
  userType: UserType
}

export interface ImageResponseVo {
  created: number
  list: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
  background?: string
  output_format?: string
  quality?: string
  size?: string
}

export interface AsyncTaskResponseVo {
  logId: string
  status: AiLogStatus
}

export interface TaskStatusResponseVo {
  logId: string
  status: AiLogStatus
  startedAt: string
  duration?: number
  points: number
  request: Record<string, unknown>
  response?: Record<string, unknown>
  images?: unknown[]
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface ImageGenerationModelParamsVo {
  name: string
  description: string
  summary?: string
  logo?: string
  tags: string[]
  mainTag?: string
  sizes: string[]
  qualities: string[]
  styles: string[]
  pricing: string
  freeForVip?: boolean
}

export interface ImageEditModelParamsVo {
  name: string
  description: string
  summary?: string
  logo?: string
  tags: string[]
  mainTag?: string
  sizes: string[]
  pricing: string
  maxInputImages: number
  freeForVip?: boolean
}

// Volcengine 任务状态枚举
export enum VolcengineTaskStatus {
  Queued = 'queued',
  Running = 'running',
  Cancelled = 'cancelled',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

// Volcengine 内容类型枚举
export enum VolcengineContentType {
  Text = 'text',
  ImageUrl = 'image_url',
}

// Volcengine 图片角色枚举
export enum VolcengineImageRole {
  FirstFrame = 'first_frame',
  LastFrame = 'last_frame',
  ReferenceImage = 'reference_image',
}

// Video DTO 接口
export interface VideoGenerationRequestDto {
  model: string
  prompt: string
  image?: string | string[]
  image_tail?: string
  mode?: string
  size?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface VideoTaskQueryDto {
  taskId: string
}

export interface VolcengineGenerationRequestDto {
  userId: string
  userType: UserType
  model: string
  content: Array<
    | {
      type: VolcengineContentType.Text
      text: string
    }
    | {
      type: VolcengineContentType.ImageUrl
      image_url: {
        url: string
      }
      role?: VolcengineImageRole
    }
  >
  return_last_frame?: boolean
}

// User Video DTO 接口
export interface UserVideoGenerationRequestDto extends VideoGenerationRequestDto {
  userId: string
  userType: UserType
}

export interface UserVideoTaskQueryDto extends VideoTaskQueryDto {
  userId: string
  userType: UserType
}

export interface UserListVideoTasksQueryDto extends Pagination {
  userId: string
  userType: UserType
}

export interface VolcengineTaskQueryDto {
  userId: string
  userType: UserType
  taskId: string
}

export interface VolcengineVideoGenerationResponseVo {
  id: string
}

export interface VideoGenerationResponseVo {
  task_id: string
  status: string
}

export interface VolcengineTaskStatusResponseVo {
  id: string
  model: string
  status: string
  error: {
    message: string
    code: string
  } | null
  created_at: number
  updated_at: number
  content?: {
    video_url?: string
    last_frame_url?: string
  }
  seed?: number
  resolution?: string
  ratio?: string
  duration?: number
  framespersecond?: number
  usage?: {
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface VideoTaskStatusResponseVo {
  task_id: string
  action: string
  status: string
  fail_reason?: string
  submit_time: number
  start_time: number
  finish_time: number
  progress: string
  data: any
}

export interface ListVideoTasksResponseVo extends PaginationVo<VideoTaskStatusResponseVo> {}

export interface VideoGenerationModelParamsVo {
  name: string
  description: string
  summary?: string
  logo?: string
  tags: string[]
  mainTag?: string
  modes: ('text2video' | 'image2video' | 'flf2video' | 'lf2video' | 'multi-image2video')[]
  channel: AiLogChannel
  resolutions: string[]
  durations: number[]
  maxInputImages: number
  aspectRatios: string[]
  defaults: {
    resolution?: string
    aspectRatio?: string
    duration?: number
  }
  pricing: Array<{
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
    price: number
  }>
  freeForVip?: boolean
}

// ==================== Query DTO 接口 ====================

// 聊天模型查询DTO
export interface ChatModelsQueryDto {
  userId?: string
  userType?: UserType
}

// 图片生成模型查询DTO
export interface ImageGenerationModelsQueryDto {
  userId?: string
  userType?: UserType
}

// 图片编辑模型查询DTO
export interface ImageEditModelsQueryDto {
  userId: string
  userType: UserType
}

// 视频生成模型查询DTO
export interface VideoGenerationModelsQueryDto {
  userId?: string
  userType?: UserType
}

// ==================== Chat 模块接口 ====================

// 消息内容类型
export interface MessageContentText {
  type: 'text'
  text: string
}

export interface MessageContentImageUrl {
  type: 'image_url'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

export interface MessageContentComplex {
  type?: string
  [key: string]: any
}

export type MessageContent = string | (MessageContentText | MessageContentImageUrl | MessageContentComplex)[]

// 聊天消息接口
export interface ChatMessage {
  role: string
  content: MessageContent
}

// Chat DTO 接口
export interface ChatCompletionDto {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  maxCompletionTokens?: number
  modalities?: ('text' | 'audio' | 'image' | 'video')[]
  topP?: number
  modelKwargs?: Record<string, any>
}

export interface UserChatCompletionDto extends ChatCompletionDto {
  userId: string
  userType: UserType
}

// Token 使用情况接口
export interface ModalitiesTokenDetails {
  text?: number
  image?: number
  audio?: number
  video?: number
  document?: number
}

export interface InputTokenDetails extends ModalitiesTokenDetails {
  cache_read?: number
  cache_creation?: number
}

export interface OutputTokenDetails extends ModalitiesTokenDetails {
  reasoning?: number
}

export interface TokenUsage {
  points?: number
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  input_token_details?: InputTokenDetails
  output_token_details?: OutputTokenDetails
}

// Chat VO 接口
export interface ChatCompletionVo {
  content: MessageContent
  model?: string
  usage?: TokenUsage
}

export interface ChatPricingModality {
  text: string
  image?: string
  audio?: string
  video?: string
}

export interface ChatPricingTier {
  maxInputTokens?: number
  input: ChatPricingModality
  output: ChatPricingModality
}

export type ChatPricing = {
  price: string
} | {
  tiers: ChatPricingTier[]
}

export interface ChatModelConfigVo {
  name: string
  description: string
  summary?: string
  logo?: string
  tags: string[]
  mainTag?: string
  inputModalities: ('text' | 'image' | 'video' | 'audio')[]
  outputModalities: ('text' | 'image' | 'video' | 'audio')[]
  pricing: ChatPricing
  freeForVip?: boolean
}

// ==================== Logs 模块接口 ====================

// Logs DTO 接口
export interface LogListQueryDto {
  userId?: string
  userType?: UserType
  page?: number
  pageSize?: number
}

export interface LogDetailQueryDto {
  id: string
  userId?: string
  userType?: UserType
}

// Logs VO 接口
export interface LogVo {
  id: string
  userId: string
  userType: UserType
  taskId?: string
  type: AiLogType
  model: string
  channel: AiLogChannel
  action?: string
  status: AiLogStatus
  startedAt?: string
  duration?: number
  points: number
  createdAt: string
  updatedAt: string
}

// Logs VO 接口
export interface LogDetailVo extends LogVo {
  errorMessage?: string
  request?: Record<string, unknown>
  response?: Record<string, unknown>
}

// 二维码艺术图生成请求DTO
export interface QrCodeArtDto {
  content: string
  referenceImageUrl?: string
  prompt: string
  model?: string
  size?: string
}

export interface UserQrCodeArtDto extends QrCodeArtDto {
  userId: string
  userType: UserType
}

// 二维码艺术图生成响应VO
export interface QrCodeArtResponseVo {
  imageUrl: string
}
