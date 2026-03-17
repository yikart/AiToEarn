/**
 * 插件相关工具函数
 */

import type { PlatAccountInfo, PlatformPublishTask, PluginPlatformType } from './types/baseTypes'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS } from './types/baseTypes'

/** 生成唯一ID */
export function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** 计算整体任务状态 */
export function calculateOverallStatus(platformTasks: PlatformPublishTask[]) {
  if (platformTasks.every(task => task.status === PlatformTaskStatus.COMPLETED)) {
    return PlatformTaskStatus.COMPLETED
  }
  if (platformTasks.some(task => task.status === PlatformTaskStatus.PUBLISHING)) {
    return PlatformTaskStatus.PUBLISHING
  }
  if (platformTasks.some(task => task.status === PlatformTaskStatus.ERROR)) {
    return PlatformTaskStatus.ERROR
  }
  return PlatformTaskStatus.PENDING
}

/** 创建初始平台账号映射 */
export function createInitialPlatformAccounts() {
  const accounts: Record<PluginPlatformType, PlatAccountInfo | null> = {} as any
  for (const platform of PLUGIN_SUPPORTED_PLATFORMS) {
    accounts[platform] = null
  }
  return accounts
}
