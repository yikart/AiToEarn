/**
 * 提交给上游 relay 服务端的视频生成请求体。
 * 透传 VideoGenerationRequestDto 的核心字段。
 */
export interface RelayVideoGenerationRequest {
  model: string
  prompt: string
  mode?: string
  size?: string
  resolution?: string
  ratio?: string
  duration?: number
  seed?: number
  watermark?: boolean
  image?: string | string[]
  image_tail?: string
  video_url?: string
  images?: string[]
  videos?: string[]
  audios?: string[]
  tools?: Array<{ type: string }>
  metadata?: Record<string, unknown>
  groupId?: string
}

/**
 * 上游 relay 服务端提交视频任务的响应体。
 * 对应 VideoGenerationResponseVo { id, status }。
 */
export interface RelayVideoSubmitResponse {
  id: string
  status: string
}

/**
 * 轮询上游 relay 服务端视频任务状态返回的响应体。
 * 对应 VideoTaskStatusResponseVo 的子集。
 */
export interface RelayVideoCallbackDto {
  id?: string
  status?: string
  videoUrl?: string
  coverUrl?: string
  error?: string | { message?: string, code?: string }
}
