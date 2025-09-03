export interface VideoGenerationRequest {
  model: string // 模型名称
  prompt: string // 提示词
  image?: string // 图片URL或base64
  image_tail?: string //  尾帧图片URL或base64
  mode?: string // 生成模式
  size?: string // 尺寸
  duration?: number // 时长
  metadata?: Record<string, unknown> // 其他参数
  apiKey?: string // API密钥
}

export interface VideoGenerationResponse {
  task_id: string
  status: string
  fail_reason: string
  action: string
  submit_time: number
  start_time: number
  finish_time: number
  progress: string
  data: Record<string, unknown>
}
export interface VideoTaskStatusRequest {
  taskId: string // 任务ID
  apiKey?: string // API密钥
}

/**
 * 视频任务状态响应接口
 */
export interface VideoTaskStatusResponse {
  task_id: string // 任务ID
  action: string // 任务动作
  status: string // 任务状态
  fail_reason?: string // 失败原因或视频URL
  submit_time: number // 提交时间
  start_time: number // 开始时间
  finish_time: number // 完成时间
  progress: string // 任务进度
  data: Record<string, unknown>
}
