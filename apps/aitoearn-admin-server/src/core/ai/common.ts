import { UserType } from '../../common'

export enum FireflycardTempTypes {
  A = 'tempA', // 默认
  B = 'tempB', // 书摘
  C = 'tempC', // 透明
  Jin = 'tempJin', // 金句
  Memo = 'tempMemo', // 备忘录
  Easy = 'tempEasy', // 便当
  BlackSun = 'tempBlackSun', // 黑日
  E = 'tempE', // 框界
  Write = 'tempWrite', // 手写
  Code = 'code', // 代码
  D = 'tempD', // 图片(暂时不用)
}
export enum KlingMode {
  Std = 'std',
  Pro = 'pro',
}

export enum VolcengineContentType {
  Text = 'text',
  ImageUrl = 'image_url',
}

export enum VolcengineImageRole {
  FirstFrame = 'first_frame',
  LastFrame = 'last_frame',
  ReferenceImage = 'reference_image',
}

export enum AspectRatio {
  Square = '1:1',
  Portrait = '9:16',
  Landscape = '16:9',
}

export interface ImageGenerationDto {
  prompt: string
  model?: string
  n?: number
  quality?: string
  response_format?: string
  size?: string
  style?: string
  user?: string
}

export interface UserImageGenerationDto extends ImageGenerationDto {
  userId: string
  userType: UserType
}

export interface VideoTaskStatusResponseVo {
  task_id: string
  action: string
  status: string
  fail_reason?: string
  submit_time: number
  start_time: number
  finish_time: number
  progress: string
  data: any
}

export enum DashscopeTaskStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
  Unknown = 'UNKNOWN',
}
