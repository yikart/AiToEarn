// 任务状态枚举
export enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Cancelled = 'cancelled',
  Completed = 'completed',
  Failed = 'failed',
}

// 图片角色枚举
export enum VideoOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

// 图片角色枚举
export enum VideoSize {
  Large = 'large',
  Small = 'small',
}

// 创建视频生成任务请求接口
export interface CreateVideoGenerationTaskRequest {
  model: string
  images?: string[]
  orientation: VideoOrientation
  prompt: string
  size: VideoSize
  duration: 10 | 15
}

// 创建视频生成任务响应接口
export interface CreateVideoGenerationTaskResponse {
  id: string
  status: TaskStatus
}

// 查询视频生成任务响应接口
export interface GetVideoGenerationTaskResponse {
  id: string
  status: TaskStatus
  video_url?: string
  thumbnail_url?: string
  status_update_time: number
  finish_reason?: string
}

// 支持的模型
export type VideoModel
  = | 'sora2'
    | 'sora2-pro'
    | string
