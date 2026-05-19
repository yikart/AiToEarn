/**
 * 插件相关工具函数
 */

import type { PlatformConfigOptions } from './types'
import type { PlatAccountInfo, PlatformPublishTask, PluginPlatformType } from './types/baseTypes'
import type { IPubParams } from '@/components/PublishDialog/publishDialog.type'
import { PlatType } from '@/app/config/platConfig'
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
  return Object.fromEntries(
    PLUGIN_SUPPORTED_PLATFORMS.map(platform => [platform, null]),
  ) as Record<PluginPlatformType, PlatAccountInfo | null>
}

/** 构造插件发布平台特定配置 */
export function buildPluginPlatformConfig(
  platform: PluginPlatformType,
  params: IPubParams,
): PlatformConfigOptions | undefined {
  if (platform === PlatType.Xhs) {
    const userDeclarationBind = params.option.xhs?.userDeclarationBind

    return userDeclarationBind === null || userDeclarationBind === undefined
      ? undefined
      : { userDeclarationBind }
  }

  if (platform === PlatType.WxSph && params.video) {
    return {
      wxSph: {
        videoMetadata: {
          width: params.video.width,
          height: params.video.height,
          duration: params.video.duration,
          size: params.video.size,
        },
        poiInfo: params.option.wxSph?.poiInfo,
        event: params.option.wxSph?.activity,
        extLink: params.option.wxSph?.extLink,
        postFlag: params.option.wxSph?.isOriginal ? 1 : 0,
      },
    }
  }

  return undefined
}
