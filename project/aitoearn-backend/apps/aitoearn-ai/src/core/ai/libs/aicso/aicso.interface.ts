export enum AicsoTaskStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export interface AicsoCreateVideoRequest {
  model: string
  prompt: string
  images?: string[]
  enhance_prompt?: boolean
  enable_upsample?: boolean
  aspect_ratio?: string
  size?: string
}

export interface AicsoCreateVideoResponse {
  id: string
  status: string
  status_update_time: number
}

export interface AicsoQueryResponse {
  id: string
  status: AicsoTaskStatus
  video_url: string | null
  enhanced_prompt?: string
  status_update_time: number
  error?: string
  detail?: {
    video_url?: string
    upsample_video_url?: string
    error_message?: string
    video_generation_error?: string
  }
}
