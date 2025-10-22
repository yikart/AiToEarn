export interface TextMessageContent {
  type: 'text'
  text: string
}

export interface ImageMessageContent {
  type: 'image_url'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

export type MessageContent = TextMessageContent | ImageMessageContent

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MessageContent[]
}

export interface GenerateTextDto {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export interface GenerateTextReviewDto {
  text: string
  desc?: string
  max?: number
}

export interface GenerateImageReviewDto {
  imageUrl: string
  title?: string
  desc?: string
  max?: number
}

export interface GenerateReviewReplyDto {
  comment: string
  title?: string
  desc?: string
  max?: number
}

export interface GenerateFireflycardDto {
  content: string
  type: string
  title?: string
}

export interface CreateJimengImageTaskDto {
  prompt: string
  width?: number
  height?: number
  sessionIds?: string[]
  model?: 'jimeng-3.0' | 'jimeng-2.1' | 'jimeng-2.0-pro' | 'jimeng-2.0' | 'jimeng-1.4' | 'jimeng-xl-pro'
  negativePrompt?: string
  sampleStrength?: number
}

export interface GetJimengTaskResultDto {
  taskId: string
}

export interface GenerateImageFromTextDto {
  prompt: string
  width?: number
  height?: number
  sessionIds?: string[]
  model?: 'jimeng-3.0' | 'jimeng-2.1' | 'jimeng-2.0-pro' | 'jimeng-2.0' | 'jimeng-1.4' | 'jimeng-xl-pro' | string
  negativePrompt?: string
  sampleStrength?: number
}

export interface GenerateVideoTitleDto {
  url: string
  min?: number
  max?: number
}

export interface GenerateHtmlDto {
  content: string
  model?: string
}

export interface GenerateMarkdownDto {
  content: string
  prompt: string
}

export interface GetMarkdownResultDto {
  taskId: string
}

export interface TextResponseVo {
  content: string
  model?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
}

export interface TextReviewVo {
  content: string
}

export interface TextReplyVo {
  content: string
}

export interface ImageResponseVo {
  images: string[]
}

export interface JimengTaskResultVo {
  taskId: string
  status: string
  images: string[]
}
