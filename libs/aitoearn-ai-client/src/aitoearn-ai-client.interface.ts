import { UserType } from '@yikart/common'

export enum AiLogType {
  Chat = 'chat',
  Image = 'image',
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
  Kling = 'kling',
  Volcengine = 'volcengine',
}

// Fireflycard 模板类型枚举
export enum FireflycardTempTypes {
  A = 'tempA',
  B = 'tempB',
  C = 'tempC',
  Jin = 'tempJin',
  Memo = 'tempMemo',
  Easy = 'tempEasy',
  BlackSun = 'tempBlackSun',
  E = 'tempE',
  Write = 'tempWrite',
  Code = 'code',
  D = 'tempD',
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
  image: string
  prompt: string
  mask?: string
  n?: number
  size?: string
  response_format?: string
  user?: string
}

export interface Md2CardDto {
  markdown: string
  theme?: string
  themeMode?: string
  width?: number
  height?: number
  splitMode?: boolean
  mdxMode?: boolean
  overHiddenMode?: boolean
}

export interface FireflyCardDto {
  content: string
  temp: FireflycardTempTypes
  title?: string
  style?: string
  switchConfig?: any
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

export interface UserMd2CardDto extends Md2CardDto {
  userId: string
  userType: UserType
}

export interface UserFireflyCardDto extends FireflyCardDto {
  userId: string
  userType: UserType
}

// Image VO 接口
export interface JimengTaskResultVo {
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

export interface ImageResponseVo {
  created: number
  list: Array<{
    url: string
    b64_json?: string
    revised_prompt?: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface Md2CardResponseVo {
  images: string[]
}

export interface FireflycardResponseVo {
  image: string
}

export interface ImageModelParamsVo {
  name: string
  description: string
  supportedSizes: string[]
  supportedQualities: string[]
  supportedStyles: string[]
  supportedFormats: string[]
  maxPromptLength: number
  pricing: {
    size: string
    quality: string
    style: string
    price: number
  }[]
}

export interface ImageGenerationModelParamsVo {
  name: string
  description: string
  supportedSizes: string[]
  supportedQualities: string[]
  supportedStyles: string[]
  supportedFormats: string[]
  maxPromptLength: number
  pricing: {
    size: string
    quality: string
    style: string
    price: number
  }[]
}

export interface ImageEditModelParamsVo {
  name: string
  description: string
  supportedSizes: string[]
  supportedQualities: string[]
  supportedStyles: string[]
  supportedFormats: string[]
  maxPromptLength: number
  pricing: {
    size: string
    quality: string
    style: string
    price: number
  }[]
}

// 画面纵横比枚举
export enum AspectRatio {
  Square = '1:1',
  Portrait = '9:16',
  Landscape = '16:9',
}

// Kling 任务状态枚举
export enum KlingTaskStatus {
  Submitted = 'submitted',
  Processing = 'processing',
  Succeed = 'succeed',
  Failed = 'failed',
}

// Kling 模式枚举
export enum KlingMode {
  Std = 'std',
  Pro = 'pro',
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
  image?: string
  image_tail?: string
  mode?: string
  size?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface VideoTaskQueryDto {
  taskId: string
}

export interface KlingText2VideoRequestDto {
  userId: string
  userType: UserType
  model_name: string
  prompt: string
  negative_prompt?: string
  cfg_scale?: number
  mode?: KlingMode
  duration?: '5' | '10'
  external_task_id?: string
}

export interface KlingImage2VideoRequestDto {
  userId: string
  userType: UserType
  model_name: string
  image?: string
  image_tail?: string
  prompt?: string
  negative_prompt?: string
  cfg_scale?: number
  mode?: KlingMode
  static_mask?: string
  duration?: '5' | '10'
  aspect_ratio?: AspectRatio
  external_task_id?: string
}

export interface KlingMultiImage2VideoRequestDto {
  userId: string
  userType: UserType
  model_name: string
  image_list: any[]
  prompt: string
  negative_prompt?: string
  mode?: KlingMode
  duration?: '5' | '10'
  aspect_ratio?: AspectRatio
  external_task_id?: string
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

export interface KlingCallbackDto {
  task_id: string
  task_status: KlingTaskStatus
  task_status_msg: string
  task_info: {
    parent_video?: {
      id: string
      url: string
      duration: string
    }
    external_task_id?: string
  }
  created_at: number
  updated_at: number
  task_result?: {
    images?: Array<{
      index: number
      url: string
    }>
    videos?: Array<{
      id: string
      url: string
      duration: string
    }>
  }
}

export interface VolcengineCallbackDto {
  id: string
  model: string
  status: VolcengineTaskStatus
  created_at: number
  updated_at: number
  content?: {
    video_url: string
    last_frame_url?: string
  }
  error?: {
    message: string
    code: string
  } | null
  seed?: number
  resolution?: string
  ratio?: string
  duration?: number
  framespersecond?: number
  usage?: {
    completion_tokens: number
    total_tokens: number
  }
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

export interface KlingTaskQueryDto {
  userId: string
  userType: UserType
  taskId: string
}

export interface VolcengineTaskQueryDto {
  userId: string
  userType: UserType
  taskId: string
}

// Video VO 接口
export interface KlingVideoGenerationResponseVo {
  task_id: string
  task_status?: string
}

export interface VolcengineVideoGenerationResponseVo {
  id: string
}

export interface VideoGenerationResponseVo {
  task_id: string
  status: string
}

export interface KlingTaskStatusResponseVo {
  task_id: string
  task_status: string
  task_status_msg: string
  task_info?: {
    parent_video?: {
      id: string
      url: string
      duration: string
    }
    external_task_id?: string
  }
  task_result?: {
    images?: Array<{
      index: number
      url: string
    }>
    videos?: Array<{
      id: string
      url: string
      duration: string
    }>
  }
  created_at: number
  updated_at: number
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

export interface VideoGenerationModelParamsVo {
  name: string
  description: string
  modes: string[]
  resolutions: string[]
  durations: number[]
  supportedParameters: string[]
  defaults?: {
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
  }
  pricing: Array<{
    resolution?: string
    aspectRatio?: string
    mode?: string
    duration?: number
    price: number
  }>
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

export interface ChatModelConfigVo {
  name: string
  description: string
  inputModalities: ('text' | 'image' | 'video' | 'audio')[]
  outputModalities: ('text' | 'image' | 'video' | 'audio')[]
  pricing: {
    prompt: string
    completion: string
    image?: string
    audio?: string
  }
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
  taskId: string
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
  request?: Record<string, unknown>
  response?: Record<string, unknown>
}
