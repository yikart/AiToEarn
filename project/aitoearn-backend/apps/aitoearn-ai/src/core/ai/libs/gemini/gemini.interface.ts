export enum VeoModel {
  Veo31Generate = 'veo-3.1-generate-001',
  Veo31FastGenerate = 'veo-3.1-fast-generate-001',
  Veo31GeneratePreview = 'veo-3.1-generate-preview',
  Veo31FastGeneratePreview = 'veo-3.1-fast-generate-preview',
}

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

/**
 * 与官方 API 保持一致的媒体内容格式 (仅支持 base64)
 */
export interface GeminiMediaContent {
  bytesBase64Encoded: string
  mimeType: string
}

/**
 * 与官方 API 保持一致的参考图片格式
 */
export interface GeminiReferenceImage {
  image: GeminiMediaContent
  referenceType: 'asset' | 'style'
}

/**
 * 与官方 API 保持一致的请求格式
 */
export interface GeminiVeoCreateVideoRequest {
  instances: Array<{
    prompt: string
    image?: GeminiMediaContent
    lastFrame?: GeminiMediaContent
    video?: GeminiMediaContent
    referenceImages?: GeminiReferenceImage[]
  }>
  parameters: {
    aspectRatio?: '16:9' | '9:16'
    durationSeconds?: number
    generateAudio?: boolean
    seed?: number
    sampleCount?: number
    storageUri?: string
  }
}

/**
 * 与官方 API 保持一致的响应格式 (仅使用 base64)
 */
export interface GeminiVeoOperationResponse {
  name: string
  done: boolean
  response?: {
    '@type': string
    'raiMediaFilteredCount'?: number
    'raiMediaFilteredReasons'?: string[]
    'videos': Array<{
      bytesBase64Encoded: string
      mimeType: string
    }>
  }
  error?: {
    code: number
    message: string
  }
}
