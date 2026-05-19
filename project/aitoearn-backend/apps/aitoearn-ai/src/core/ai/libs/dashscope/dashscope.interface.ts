export enum DashscopeTaskStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
  Unknown = 'UNKNOWN',
}

export interface DashscopeVideoMedia {
  type: string
  url: string
}

export interface DashscopeCreateVideoTaskRequest {
  model: string
  input: {
    prompt?: string
    media?: DashscopeVideoMedia[]
  }
  parameters?: {
    resolution?: string
    ratio?: string
    duration?: number
    watermark?: boolean
    seed?: number
  }
}

export interface DashscopeCreateVideoTaskResponse {
  output?: {
    task_id?: string
    task_status?: DashscopeTaskStatus
  }
  request_id?: string
  code?: string
  message?: string
}

export interface DashscopeQueryVideoTaskResponse {
  request_id?: string
  output: {
    task_id: string
    task_status: DashscopeTaskStatus
    submit_time?: string
    scheduled_time?: string
    end_time?: string
    orig_prompt?: string
    video_url?: string
    code?: string
    message?: string
  }
  usage?: {
    duration?: number
    input_video_duration?: number
    output_video_duration?: number
    video_count?: number
    SR?: number
    ratio?: string
  }
}
