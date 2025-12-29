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
}

/**
 * 插件支持的平台列表
 */
export const PLUGIN_SUPPORTED_PLATFORMS = [
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
 * HTTP 请求方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'DELETE'

/**
 * 平台通用请求参数
 */
export interface PlatformRequestParams {
  /** API 路径 */
  path: string
  /** HTTP 方法，默认 POST */
  method?: HttpMethod
  /** 请求数据 */
  data?: any
  /** 额外请求头 */
  headers?: Record<string, string>
}

/**
 * 抖音交互操作参数
 */
export interface DouyinInteractionParams {
  /** 操作类型：点赞、收藏、评论 */
  action: 'like' | 'favorite' | 'comment'
  /** 作品ID */
  workId: string
  /** 目标状态：true=执行操作，false=取消操作 */
  targetState: boolean
  /** 评论内容（action 为 comment 时必填） */
  content?: string
}

/**
 * 抖音私信参数
 */
export interface DouyinDirectMessageParams {
  /** 作品ID（二选一） */
  workId?: string
  /** 作者链接（二选一） */
  authorUrl?: string
  /** 私信内容 */
  content: string
}

/**
 * 抖音交互操作结果
 */
export interface DouyinInteractionResult {
  /** 是否成功 */
  success: boolean
  /** 提示信息 */
  message?: string
  /** 错误信息 */
  error?: string
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

  /**
   * 小红书通用请求
   * 自动处理签名，返回原始响应
   * @param params 请求参数
   * @returns Promise<响应数据>
   */
  xhsRequest: <T = any>(params: PlatformRequestParams) => Promise<T>

  /**
   * 抖音通用请求
   * 返回原始响应
   * @param params 请求参数
   * @returns Promise<响应数据>
   */
  douyinRequest: <T = any>(params: PlatformRequestParams) => Promise<T>

  /**
   * 抖音交互操作（自动化方案）
   * 支持点赞、收藏、评论
   * @param params 交互参数
   * @returns Promise<交互结果>
   */
  douyinInteraction: (params: DouyinInteractionParams) => Promise<DouyinInteractionResult>

  /**
   * 抖音私信（自动化方案）
   * 根据作品ID或作者链接发送私信
   * @param params 私信参数
   * @returns Promise<私信结果>
   */
  douyinDirectMessage: (params: DouyinDirectMessageParams) => Promise<DouyinInteractionResult>
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
 * 插件 Store 状态接口（只定义属性，方法在 store 中实现）
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
}

/**
 * 操作结果类型
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}
