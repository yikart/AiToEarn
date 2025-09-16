// 任务状态枚举
export enum TaskStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
}

// 支持的模型
export type DashscopeVideoModel
  = | 'wan2.2-i2v-flash'
    | 'wan2.2-i2v-plus'
    | 'wanx2.1-i2v-plus'
    | 'wanx2.1-i2v-turbo'
    | 'wan2.2-kf2v-flash'
    | 'wanx2.1-kf2v-plus'
    | 'wan2.2-t2v-plus'
    | 'wanx2.1-t2v-turbo'
    | 'wanx2.1-t2v-plus'
    | string

// 支持的分辨率
export type Resolution = '480P' | '720P' | '1080P' | string

// 支持的视频尺寸
export type VideoSize
  = | '1920*1080'
    | '1280*720'
    | '854*480'
    | '720*1280'
    | '480*854'
    | '1080*1920'
    | string

// 错误信息接口
export interface TaskError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 请求ID */
  request_id?: string
}

// 图生视频输入
export interface ImageToVideoInput {
  image_url: string
  prompt?: string
  negative_prompt?: string
}

// 首尾帧生视频输入
export interface KeyFrameToVideoInput {
  first_frame_url: string
  last_frame_url?: string
  prompt?: string
  negative_prompt?: string
  template?: string
}

// 文生视频输入
export interface TextToVideoInput {
  prompt: string
  negative_prompt?: string
}

// 图生视频参数配置
export interface ImageToVideoParameters {
  /** 分辨率 */
  resolution?: Resolution
  /** 是否扩展提示词 */
  prompt_extend?: boolean
}

// 首尾帧生视频参数配置
export interface KeyFrameToVideoParameters {
  /** 分辨率 */
  resolution?: Resolution
  /** 是否扩展提示词 */
  prompt_extend?: boolean
  /** 视频时长（秒） */
  duration?: number
}

// 文生视频参数配置
export interface TextToVideoParameters {
  /** 视频尺寸 */
  size?: VideoSize
  /** 是否扩展提示词 */
  prompt_extend?: boolean
  /** 视频时长（秒） */
  duration?: number
}

// 创建视频生成任务响应接口
export interface CreateVideoTaskResponse {
  /** HTTP状态码 */
  status_code: number
  /** 请求ID */
  request_id: string
  /** 错误码 */
  code: string | null
  /** 错误消息 */
  message: string
  /** 输出结果 */
  output: {
    /** 任务ID */
    task_id: string
    /** 任务状态 */
    task_status: TaskStatus
    /** 视频URL（仅在任务完成时返回） */
    video_url?: string
  }
  /** 使用量统计（仅在任务完成时返回） */
  usage?: {
    /** 视频数量 */
    video_count: number
    /** 视频时长（秒） */
    video_duration: number
    /** 视频分辨率 */
    video_ratio: string
  } | null
}

// 查询视频生成任务响应接口
export interface GetVideoTaskResponse {
  /** HTTP状态码 */
  status_code: number
  /** 请求ID */
  request_id: string
  /** 错误码 */
  code: string | null
  /** 错误消息 */
  message: string
  /** 输出结果 */
  output: {
    /** 任务ID */
    task_id: string
    /** 任务状态 */
    task_status: TaskStatus
    /** 视频URL（仅在任务完成时返回） */
    video_url?: string
    /** 任务提交时间 */
    submit_time?: string
    /** 任务调度时间 */
    scheduled_time?: string
    /** 任务结束时间 */
    end_time?: string
    /** 原始提示词 */
    orig_prompt?: string
    /** 实际使用的提示词 */
    actual_prompt?: string
  }
  /** 使用量统计（仅在任务完成时返回） */
  usage?: {
    /** 视频数量 */
    video_count: number
    /** 视频时长（秒） */
    video_duration: number
    /** 视频分辨率 */
    video_ratio: string
  } | null
}

// 图生视频请求
export interface ImageToVideoRequest {
  model: DashscopeVideoModel
  input: ImageToVideoInput
  parameters?: ImageToVideoParameters
}

// 首尾帧生视频请求
export interface KeyFrameToVideoRequest {
  model: DashscopeVideoModel
  input: KeyFrameToVideoInput
  parameters?: KeyFrameToVideoParameters
}

// 文生视频请求
export interface TextToVideoRequest {
  model: DashscopeVideoModel
  input: TextToVideoInput
  parameters?: TextToVideoParameters
}
