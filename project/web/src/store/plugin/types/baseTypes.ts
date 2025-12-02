/**
 * 浏览器插件相关类型定义
 */

import type {
  PublishParams as BasePublishParams,
  PlatformPublishTask,
  ProgressEvent,
  PublishTask,
  PublishTaskListConfig,
} from './index'
import type { PlatAccountInfo } from './plat.type'
import { PlatType } from '@/app/config/platConfig'

// 导出任务相关类型
export type { PlatformPublishTask, PublishTask, PublishTaskListConfig }
export { PlatformTaskStatus } from './publishTask.types'

/**
 * 发布结果
 */
interface PublishResult {
  success: boolean
  workId?: string
  shareLink?: string
  publishTime?: number
  failReason?: string
  errorCode?: string
}

/**
 * 导出基础类型
 */
export type { PlatAccountInfo, ProgressEvent, PublishResult }

/**
 * 插件连接状态
 */
export enum PluginStatus {
  /** 未检测 */
  UNKNOWN = 'UNKNOWN',
  /** 检测中 */
  CHECKING = 'CHECKING',
  /** 已就绪（已安装且已授权） */
  READY = 'READY',
  /** 已安装但未授权 */
  INSTALLED_NO_PERMISSION = 'INSTALLED_NO_PERMISSION',
  /** 未安装 */
  NOT_INSTALLED = 'NOT_INSTALLED',
  /** 已连接（兼容旧代码） */
  CONNECTED = 'READY',
}

/**
 * 插件支持的平台列表
 */
export const PLUGIN_SUPPORTED_PLATFORMS = [
  PlatType.Douyin,
  PlatType.Xhs,
] as const

/**
 * 插件支持的平台类型（直接复用 PlatType）
 */
export type PluginPlatformType = typeof PLUGIN_SUPPORTED_PLATFORMS[number]

/**
 * 发布参数（扩展基础类型，添加 platform 字段）
 */
export interface PublishParams extends BasePublishParams {
  platform: PluginPlatformType
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (event: ProgressEvent) => void

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /** 是否已授予所有必需权限 */
  granted: boolean
  /** 已授予的权限列表 */
  permissions?: string[]
}

/**
 * 插件 API 接口定义
 */
export interface AIToEarnPluginAPI {
  /**
   * 检查插件权限
   * @returns Promise<权限检查结果>
   */
  checkPermission: () => Promise<PermissionCheckResult>

  /**
   * 登录到指定平台
   * @param platform 平台类型
   * @returns Promise<账号信息>
   */
  login: (platform: PluginPlatformType) => Promise<PlatAccountInfo>

  /**
   * 发布内容到指定平台
   * @param params 发布参数
   * @param onProgress 进度回调函数
   * @returns Promise<发布结果>
   */
  publish: (
    params: PublishParams,
    onProgress?: ProgressCallback,
  ) => Promise<PublishResult>
}

/**
 * 扩展 Window 接口
 */
declare global {
  interface Window {
    // @ts-ignore
    AIToEarnPlugin?: AIToEarnPluginAPI
  }
}

/**
 * 插件 Store 状态接口
 */
export interface PluginStore {
  /** 插件连接状态 */
  status: PluginStatus

  /** 轮询定时器 ID */
  pollingTimer: NodeJS.Timeout | null

  /** 是否正在发布 */
  isPublishing: boolean

  /** 当前发布进度 */
  publishProgress: ProgressEvent | null

  /** 发布任务列表 */
  publishTasks?: PublishTask[]

  /** 任务列表配置 */
  taskListConfig?: PublishTaskListConfig

  /** 检查插件是否可用 */
  checkPlugin: () => boolean

  /** 开始轮询插件状态 */
  startPolling: (interval?: number) => void

  /** 停止轮询插件状态 */
  stopPolling: () => void

  /** 登录到指定平台 */
  login: (platform: PluginPlatformType) => Promise<PlatAccountInfo>

  /**
   * 发布内容到指定平台
   * @param params 发布参数
   * @param onProgress 进度回调函数
   * @returns Promise<发布结果>
   */
  publish: (
    params: PublishParams,
    onProgress?: ProgressCallback,
  ) => Promise<PublishResult>

  /** 重置发布状态 */
  resetPublishState: () => void

  /** 添加发布任务 */
  addPublishTask?: (task: Omit<PublishTask, 'id' | 'createdAt' | 'updatedAt' | 'overallStatus'>) => string

  /** 更新平台任务 */
  updatePlatformTask?: (taskId: string, platform: PluginPlatformType, updates: Partial<PlatformPublishTask>) => void

  /** 删除发布任务 */
  deletePublishTask?: (taskId: string) => void

  /** 清空所有任务 */
  clearPublishTasks?: () => void

  /** 获取任务详情 */
  getPublishTask?: (taskId: string) => PublishTask | undefined

  /** 更新任务列表配置 */
  updateTaskListConfig?: (config: Partial<PublishTaskListConfig>) => void
}

/**
 * 操作结果类型
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}
