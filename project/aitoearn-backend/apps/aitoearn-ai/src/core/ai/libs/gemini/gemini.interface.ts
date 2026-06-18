/**
 * 图片生成尺寸选项
 */
export type GeminiImageSize = '0.5K' | '1K' | '2K' | '4K'

/**
 * 图片生成宽高比选项
 */
export type GeminiImageAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
export type GeminiImageModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview'

/**
 * 图片 token 明细（按模态）
 */
export interface GeminiModalityTokenDetails {
  text?: number
  image?: number
  audio?: number
  video?: number
}

/**
 * 图片生成请求参数
 */
export interface GeminiImageGenerateRequest {
  prompt: string
  imageUrls?: string[]
  imageSize?: GeminiImageSize
  aspectRatio?: GeminiImageAspectRatio
  model?: GeminiImageModel
}

/**
 * 单张图片数据
 */
export interface GeminiGeneratedImage {
  imageData: Buffer
  mimeType: string
}

/**
 * 图片生成 Usage 信息
 */
export interface GeminiImageUsage {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
  inputTokenDetails?: GeminiModalityTokenDetails
  outputTokenDetails?: GeminiModalityTokenDetails
}

/**
 * 图片生成响应
 */
export interface GeminiImageGenerateResponse {
  images: GeminiGeneratedImage[]
  usage?: GeminiImageUsage
}
