/**
 * 发布任务相关类型定义
 */

import type { PluginPlatformType, ProgressEvent, PublishParams, PublishResult } from './baseTypes'

/**
 * 平台发布任务状态
 */
export enum PlatformTaskStatus {
  /** 待发布 */
  PENDING = 'pending',
  /** 发布中 */
  PUBLISHING = 'publishing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  ERROR = 'error',
}

/**
 * 单个平台的发布任务
 */
export interface PlatformPublishTask {
  /** 任务唯一ID（用于精确匹配更新） */
  id: string

  /** 插件返回的请求ID（用于匹配进度回调） */
  requestId?: string

  /** 平台类型 */
  platform: PluginPlatformType

  /** 账号ID，用于关联账号信息 */
  accountId?: string

  /** 发布参数 */
  params: PublishParams

  /** 任务状态 */
  status: PlatformTaskStatus

  /** 进度信息 */
  progress: ProgressEvent | null

  /** 发布结果 */
  result: PublishResult | null

  /** 开始时间 */
  startTime: number | null

  /** 结束时间 */
  endTime: number | null

  /** 错误信息 */
  error: string | null
}

/**
 * 发布任务（包含多个平台）
 */
export interface PublishTask {
  /** 任务ID */
  id: string

  /** 任务标题（用于展示） */
  title: string

  /** 任务描述 */
  description?: string

  /** 包含的平台任务列表 */
  platformTasks: PlatformPublishTask[]

  /** 创建时间 */
  createdAt: number

  /** 更新时间 */
  updatedAt: number

  /** 整体任务状态 */
  overallStatus: PlatformTaskStatus
}

/**
 * 发布任务列表配置
 */
export interface PublishTaskListConfig {
  /** 最大保存任务数 */
  maxTasks?: number

  /** 是否自动清理已完成任务 */
  autoCleanCompleted?: boolean

  /** 自动清理的时间（毫秒，默认24小时） */
  cleanAfter?: number
}
