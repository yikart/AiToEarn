// 消息内容类型
export interface MessageContent {
  type: 'text' | 'image_url' | string
  text?: string
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
  [key: string]: unknown
}

// 聊天消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MessageContent[]
}

// 用户AI聊天请求接口
export interface UserAiChatRequest {
  userId: string
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

// 用户AI聊天响应接口
export interface UserAiChatResponse {
  content: string | any
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// 用户日志查询请求接口
export interface UserLogsQueryRequest {
  userId: string
  page?: number
  size?: number
  start_timestamp?: number
  end_timestamp?: number
  model_name?: string
}

// 用户日志信息接口
export interface UserLogInfo {
  id: number
  created_at: number
  content: string
  model_name: string
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
}

// 用户日志响应接口
export interface UserLogsResponse {
  items: UserLogInfo[]
  total: number
  page: number
  page_size: number
}

// 用户图片生成请求接口
export interface UserImageGenerationRequest {
  userId: string
  prompt: string
  model?: string
  n?: number
  quality?: string
  response_format?: 'url' | 'b64_json'
  size?: string
  style?: string
  user?: string
}

// 用户图片编辑请求接口
export interface UserImageEditRequest {
  userId: string
  image: string
  prompt: string
  mask?: string
  model?: string
  n?: number
  size?: string
  response_format?: 'url' | 'b64_json'
  user?: string
}

// 用户图片变体请求接口
export interface UserImageVariationRequest {
  userId: string
  image: string
  model?: string
  n?: number
  size?: string
  response_format?: 'url' | 'b64_json'
  user?: string
}

// 图片对象接口
export interface ImageObject {
  url?: string
  b64_json?: string
  revised_prompt?: string
}

// 用户图片响应接口
export interface UserImageResponse {
  created: number
  list: ImageObject[]
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// MJ用户视频生成请求接口
export interface UserVideoGenerationRequest {
  userId: string
  base64?: string
  mode?: string
  prompt: string
  motion: string
  video_type?: string
  animate_mode?: string
  action?: string
  taskId?: string
  index?: number
}

// MJ视频任务提交响应接口
export interface MjVideoSubmitResponse {
  code: number
  description: string
  result: string
  properties: {
    prompt: string
  }
}

// MJ视频任务状态查询请求接口
export interface VideoTaskStatusQueryRequest {
  userId: string
  taskId: string
}

// MJ任务查询响应接口
export interface MjTaskFetchResponse {
  id: string
  prompt: string
  imageUrl: string
  enqueue_time: string
  width: number
  height: number
  batch_size: number
  status: string
  job_type: string
  video_url: string
  video_urls: string[]
  progress: string
  action: string
}

// 通用视频生成请求接口
export interface UserVideoGenerationCommonRequest {
  userId: string
  model: string
  prompt: string
  image?: string
  mode?: string
  size?: string
  duration?: number
  metadata?: Record<string, any>
}

// 通用视频生成响应接口
export interface VideoGenerationResponse {
  task_id: string
  status: string
  message?: string
}

// 通用视频任务状态查询请求接口
export interface UserVideoTaskQueryRequest {
  userId: string
  taskId: string
}

// 通用视频任务状态响应接口
export interface VideoTaskStatusResponse {
  task_id: string
  action: string
  status: string
  fail_reason?: string
  submit_time: number
  start_time: number
  finish_time: number
  progress: string
  data: {
    id: string
    model: string
    status: string
    content: {
      video_url: string
    }
    usage: {
      completion_tokens: number
      total_tokens: number
    }
    created_at: number
    updated_at: number
    seed: number
    duration: number
    framespersecond: number
  }
}

// MD2Card生成请求接口
export interface Md2CardGenerationRequest {
  userId: string
  markdown: string
  theme?: string
  themeMode?: string
  width?: number
  height?: number
  splitMode?: string
  mdxMode?: boolean
  overHiddenMode?: boolean
}

// MD2Card生成响应接口
export interface Md2CardGenerationResponse {
  images: Array<{
    url: string
    fileName: string
  }>
}

// Fireflycard生成请求接口
export interface FireflycardGenerationRequest {
  userId: string
  content: string
  temp?: string
  title?: string
  style?: {
    align?: string
    backgroundName?: string
    backShadow?: string
    font?: string
    width?: number
    ratio?: string
    height?: number
    fontScale?: number
    padding?: string
    borderRadius?: string
    color?: string
    opacity?: number
    blur?: number
    backgroundAngle?: string
    lineHeights?: {
      content?: string
    }
    letterSpacings?: {
      content?: string
    }
  }
  switchConfig?: {
    showIcon?: boolean
    showDate?: boolean
    showTitle?: boolean
    showContent?: boolean
    showAuthor?: boolean
    showTextCount?: boolean
    showQRCode?: boolean
    showPageNum?: boolean
    showWatermark?: boolean
  }
}

// Fireflycard生成响应接口
export interface FireflycardGenerationResponse {
  image: string
}

// 图片生成模型参数接口
export interface ImageGenerationModel {
  name: string
  description: string
  sizes: string[]
  qualities: string[]
  styles: string[]
}

// 图片编辑模型参数接口
export interface ImageEditModel {
  name: string
  description: string
  sizes: string[]
}

// 视频生成模型参数接口
export interface VideoGenerationModel {
  name: string
  description: string
  modes: string[]
  sizes: string[]
  durations: number[]
  supportedParameters: string[]
}

// 获取模型参数请求接口
export interface GetModelParamsRequest {
  userId: string
}

// 对话模型参数接口
export interface ChatModel {
  name: string
  description: string
  inputModalities: ('text' | 'image' | 'video' | 'audio')[]
  outputModalities: ('text' | 'image' | 'video' | 'audio')[]
  pricing: {
    prompt: string
    completion: string
    image: string
    audio: string
  }
}
