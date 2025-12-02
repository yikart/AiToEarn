/**
 * 浏览器插件相关类型定义
 */

import type {
  PublishParams as BasePublishParams,
  ProgressEvent,
} from './index'
import type { PlatAccountInfo } from './plat.type'

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
  /** 已连接 */
  CONNECTED = 'CONNECTED',
  /** 未安装 */
  NOT_INSTALLED = 'NOT_INSTALLED',
}

/**
 * 平台类型
 */
export type PlatformType = 'douyin' | 'xhs'

/**
 * 发布参数（扩展基础类型，添加 platform 字段）
 */
export interface PublishParams extends BasePublishParams {
  platform: PlatformType
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (event: ProgressEvent) => void

/**
 * 插件 API 接口定义
 */
export interface AIToEarnPluginAPI {
  /**
   * 登录到指定平台
   * @param platform 平台类型
   * @returns Promise<账号信息>
   */
  login: (platform: PlatformType) => Promise<PlatAccountInfo>

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

  /** 检查插件是否可用 */
  checkPlugin: () => boolean

  /** 开始轮询插件状态 */
  startPolling: (interval?: number) => void

  /** 停止轮询插件状态 */
  stopPolling: () => void

  /** 登录到指定平台 */
  login: (platform: PlatformType) => Promise<PlatAccountInfo>

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
}

/**
 * 操作结果类型
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
}
