import { UserType } from '@yikart/common'
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
