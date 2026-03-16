export enum GrokVideoTaskStatus {
  Pending = 'pending',
  Done = 'done',
  Failed = 'failed',
  Expired = 'expired',
}

export type GrokAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3'

export type GrokResolution = '480p' | '720p'

export interface GrokCreateVideoRequest {
  model: string
  prompt: string
  duration?: number // 1-15s
  aspect_ratio?: GrokAspectRatio
  resolution?: GrokResolution
  image?: {
    url: string
  }
}

export interface GrokEditVideoRequest {
  model: string
  prompt: string
  video: {
    url: string
  }
}

export interface GrokCreateVideoResponse {
  request_id: string
}

export interface GrokGetVideoStatusResponse {
  request_id?: string
  status?: GrokVideoTaskStatus
  model?: string
  video?: {
    url: string
    duration: number
    respect_moderation: boolean
  }
  error?: {
    code: string
    message: string
  }
}
