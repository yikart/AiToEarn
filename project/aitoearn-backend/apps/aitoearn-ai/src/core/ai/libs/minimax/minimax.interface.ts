export interface MiniMaxBaseResponse {
  status_code: number
  status_msg: string
}

export interface MiniMaxImageGenerationRequest {
  model: 'image-01' | 'image-01-live' | string
  prompt: string
  aspect_ratio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '3:4' | '9:16' | '21:9' | string
  width?: number
  height?: number
  response_format?: 'url' | 'base64'
  seed?: number
  n?: number
  prompt_optimizer?: boolean
  subject_reference?: Array<{
    type: string
    image_file: string
  }>
}

export interface MiniMaxImageGenerationResponse {
  id: string
  data?: {
    image_urls?: string[]
    image_base64?: string[]
    images?: string[]
  }
  metadata?: {
    failed_count?: string
    success_count?: string
  }
  base_resp: MiniMaxBaseResponse
}

export interface MiniMaxCreateVideoTaskRequest {
  model: string
  prompt?: string
  first_frame_image?: string
  last_frame_image?: string
  duration?: number
  resolution?: '512P' | '720P' | '768P' | '1080P' | string
  prompt_optimizer?: boolean
  fast_pretreatment?: boolean
  callback_url?: string
  subject_reference?: Array<{
    type: string
    image_file: string
  }>
}

export interface MiniMaxCreateVideoTaskResponse {
  task_id?: string
  base_resp: MiniMaxBaseResponse
}

export enum MiniMaxVideoTaskStatus {
  Preparing = 'Preparing',
  Queueing = 'Queueing',
  Processing = 'Processing',
  Success = 'Success',
  Fail = 'Fail',
}

export interface MiniMaxQueryVideoTaskResponse {
  task_id: string
  status: MiniMaxVideoTaskStatus
  file_id?: string
  video_width?: number
  video_height?: number
  base_resp: MiniMaxBaseResponse
}

export interface MiniMaxRetrieveFileResponse {
  file?: {
    file_id: string
    bytes?: number
    created_at?: number
    filename?: string
    purpose?: string
    download_url?: string
  }
  base_resp: MiniMaxBaseResponse
}

export interface MiniMaxTextToSpeechRequest {
  model: string
  text: string
  stream?: boolean
  language_boost?: string
  output_format?: 'url' | 'hex'
  voice_setting?: Record<string, unknown>
  audio_setting?: Record<string, unknown>
  pronunciation_dict?: Record<string, unknown>
  voice_modify?: Record<string, unknown>
  subtitle_enable?: boolean
  subtitle_type?: string
}

export interface MiniMaxTextToSpeechResponse {
  data?: {
    audio?: string
    status?: number
    subtitle_file?: string
  } | null
  trace_id?: string
  extra_info?: Record<string, unknown>
  base_resp: MiniMaxBaseResponse
}

export interface MiniMaxMusicGenerationRequest {
  model: string
  prompt?: string
  lyrics?: string
  stream?: boolean
  output_format?: 'url' | 'hex'
  audio_setting?: Record<string, unknown>
  lyrics_optimizer?: boolean
  is_instrumental?: boolean
  audio_url?: string
  audio_base64?: string
  cover_feature_id?: string
}

export interface MiniMaxMusicGenerationResponse {
  data?: {
    audio?: string
    status?: number
  } | null
  trace_id?: string
  extra_info?: Record<string, unknown>
  analysis_info?: unknown
  base_resp: MiniMaxBaseResponse
}
