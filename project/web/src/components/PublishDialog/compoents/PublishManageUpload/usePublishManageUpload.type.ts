import type {
  UploadTaskStatusEnum,
  UploadTaskTypeEnum,
} from './publishManageUpload.enum'

/**
 * 上传任务状态机
 * - hashing: 正在计算 MD5
 * - pending: 等待上传/准备上传
 * - uploading: 上传中（有进度）
 * - success: 上传完成
 * - error: 上传失败
 * - canceled: 用户取消
 */
export type UploadTaskStatus = UploadTaskStatusEnum

/** 上传任务类型：图片/视频/视频封面 */
export type UploadTaskType = UploadTaskTypeEnum

/**
 * 单个上传任务的状态记录（Zustand 中保存）
 */
export interface UploadTask {
  id: string
  fileName: string
  size: number
  type: UploadTaskType
  status: UploadTaskStatus
  progress: number
  md5?: string
  fromCache?: boolean
  errorMessage?: string
  createdAt: number
  updatedAt: number
}

/** 缓存项：按 MD5 复用上传结果 */
export interface UploadCacheItem {
  ossKey: string
  ossUrl: string
}

/** 返回给调用方的上传结果（包含是否命中缓存） */
export interface UploadResult extends UploadCacheItem {
  fromCache: boolean
}

/**
 * 运行时实体：同 MD5 共享一个底层上传与进度
 * - 多任务复用相同 runtime（节省带宽）
 */
export interface UploadRuntime {
  controller: AbortController
  promise: Promise<UploadCacheItem>
  progress: number
  taskIds: Set<string>
  completed: boolean
}

/** 新建上传任务的参数 */
export interface StartUploadOptions {
  file: Blob
  type: UploadTaskType
  fileName?: string
  taskId?: string
}

/** 全局上传管理的状态 */
export interface IPublishManageUploadState {
  tasks: Record<string, UploadTask>
  md5Cache: Record<string, UploadCacheItem>
}
