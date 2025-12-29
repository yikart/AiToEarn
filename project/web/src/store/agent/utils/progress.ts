/**
 * Agent Store - 进度工具
 * 进度计算和状态配置
 */

import { BASE_PROGRESS, GENERATING_STATUSES, STATUS_CONFIG } from '../agent.constants'

/**
 * 计算任务进度
 * @param currentProgress 当前进度
 * @param status 状态
 * @param isNewStatus 是否是新状态
 */
export function calculateProgress(currentProgress: number, status: string, isNewStatus: boolean): number {
  if (GENERATING_STATUSES.includes(status) && !isNewStatus) {
    // 增加 5%，但不超过 99%
    return Math.min(currentProgress + 5, 99)
  }

  if (isNewStatus) {
    const targetProgress = BASE_PROGRESS[status]
    if (targetProgress !== undefined) {
      return Math.max(currentProgress, targetProgress)
    }
  }

  return currentProgress
}

/**
 * 获取状态配置
 * @param status 状态
 */
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { text: status, color: '#333' }
}
