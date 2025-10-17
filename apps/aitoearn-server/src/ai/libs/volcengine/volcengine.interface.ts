// 任务状态枚举
export enum TaskStatus {
  Queued = 'queued',
  Running = 'running',
  Cancelled = 'cancelled',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

// 内容类型枚举
export enum ContentType {
  Text = 'text',
  ImageUrl = 'image_url',
}

// 图片角色枚举
export enum ImageRole {
  FirstFrame = 'first_frame',
  LastFrame = 'last_frame',
  ReferenceImage = 'reference_image',
}

// 错误信息接口
export interface TaskError {
  /** 错误码 */
  code: string
  /** 错误提示信息 */
  message: string
}

// 图片URL接口
export interface ImageUrl {
  /** 图片信息，可以是图片URL或图片Base64编码。图片URL需确保可被访问；Base64编码格式：data:image/<图片格式>;base64,<Base64编码> */
  url: string
}

// 文本内容接口
export interface TextContent {
  /** 输入内容的类型，此处应为text */
  type: ContentType.Text
  /** 输入给模型的文本内容，描述期望生成的视频。支持中英文，建议不超过500字。可在文本提示词后追加--[parameters]控制视频输出规格 */
  text: string
}

// 图片内容接口
export interface ImageContent {
  /** 输入内容的类型，此处应为image_url */
  type: ContentType.ImageUrl
  /** 输入给模型的图片对象 */
  image_url: ImageUrl
  /** 图片的位置或用途。首帧图生视频可不填或为first_frame；首尾帧图生视频必填first_frame/last_frame；参考图生视频必填reference_image */
  role?: ImageRole
}

// 内容联合类型
export type Content = TextContent | ImageContent

// 视频内容接口
export interface VideoContent {
  /** 生成视频的URL，格式为mp4。为保障信息安全，生成的视频会在24小时后被清理，请及时转存 */
  video_url: string
  /** 视频的尾帧图像URL。有效期为24小时，请及时转存。说明：创建视频生成任务时设置"return_last_frame": true时，会返回参数 */
  last_frame_url?: string
}

// 使用量统计接口
export interface Usage {
  /** 模型生成的token数量 */
  completion_tokens: number
  /** 视频生成模型不统计输入token，输入token为0，故total_tokens=completion_tokens */
  total_tokens: number
}

// 创建视频生成任务请求接口
export interface CreateVideoGenerationTaskRequest {
  /** 您需要调用的模型的ID（Model ID）或Endpoint ID */
  model: string
  /** 输入给模型，生成视频的信息，支持文本信息和图片信息 */
  content: Content[]
  /** 填写本次生成任务结果的回调通知地址。当视频生成任务有状态变化时，方舟将向此地址推送POST请求 */
  callback_url?: string
  /** 是否返回生成视频的尾帧图像。仅doubao-seedance-1-0-lite-i2v支持该参数。默认值false */
  return_last_frame?: boolean
}

// 创建视频生成任务响应接口
export interface CreateVideoGenerationTaskResponse {
  /** 视频生成任务ID。创建视频生成任务为异步接口，获取ID后，需要通过查询视频生成任务API来查询视频生成任务的状态 */
  id: string
}

// 查询视频生成任务响应接口
export interface GetVideoGenerationTaskResponse {
  /** 视频生成任务ID */
  id: string
  /** 任务使用的模型名称和版本，模型名称-版本 */
  model: string
  /** 任务状态：queued（排队中）、running（任务运行中）、cancelled（取消任务，取消状态24h自动删除）、succeeded（任务成功）、failed（任务失败） */
  status: TaskStatus
  /** 错误提示信息，任务成功返回null，任务失败时返回错误数据 */
  error: TaskError | null
  /** 任务创建时间的Unix时间戳（秒） */
  created_at: number
  /** 任务当前状态更新时间的Unix时间戳（秒） */
  updated_at: number
  /** 当视频生成任务完成，会输出该字段，包含生成视频下载的URL */
  content?: VideoContent
  /** 本次请求使用的种子整数值 */
  seed?: number
  /** 生成视频的分辨率 */
  resolution?: string
  /** 生成视频的宽高比 */
  ratio?: string
  /** 生成视频的时长，单位：秒 */
  duration?: number
  /** 生成视频的帧率 */
  framespersecond?: number
  /** 本次请求的token用量 */
  usage?: Usage
}

// 支持的分辨率
export type Resolution = '480p' | '720p' | '1080p' | string

// 支持的宽高比
export type Ratio
  = | '21:9'
    | '16:9'
    | '4:3'
    | '1:1'
    | '3:4'
    | '9:16'
    | '9:21'
    | 'keep_ratio'
    | 'adaptive'
    | string

// 支持的模型
export type VideoModel
  = | 'doubao-seedance-pro'
    | 'doubao-seedance-1-0-lite-t2v'
    | 'doubao-seedance-1-0-lite-i2v'
    | 'wan2-1-14b-t2v'
    | 'wan2-1-14b-i2v'
    | 'wan2-1-14b-flf2v'
    | string
