import { UserType } from '../../common'

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
export interface AiChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

// 用户AI聊天响应接口
export interface AiChatResponse {
  content: unknown
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// 用户图片生成请求接口
export interface ImageGenerationRequest {
  prompt: string
  model?: string
  n?: number
  quality?: string
  response_format?: 'url' | 'b64_json'
  size?: string
  style?: string
  userId?: string
  userType?: UserType
}

// 用户图片编辑请求接口
export interface ImageEditRequest {
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
export interface ImageVariationRequest {
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
export interface ImageResponse {
  created: number
  list: ImageObject[]
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// 通用视频生成请求接口
export interface VideoGenerationCommonRequest {
  userId: string
  userType: UserType
  model: string
  prompt: string
  image?: string | string[]
  mode?: string
  size?: string
  duration?: number
  metadata?: Record<string, unknown>
}

// 通用视频生成响应接口
export interface VideoGenerationResponse {
  task_id: string
  status: string
  fail_reason: string
  action: string
  submit_time: number
  start_time: number
  finish_time: number
  progress: string
  data: Record<string, unknown>
}

// 通用视频任务状态查询请求接口
export interface VideoTaskQueryRequest {
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
