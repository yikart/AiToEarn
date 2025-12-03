/**
 * 浏览器插件相关工具函数
 */

import type { ProgressEvent } from '@/store'
import { PluginStatus } from '@/store'
import { PLUGIN_STATUS_I18N_KEY, PUBLISH_STAGE_I18N_KEY } from './constants'

/**
 * 获取插件状态的国际化 key
 * @param status 插件状态
 * @returns i18n key
 */
export function getPluginStatusI18nKey(status: PluginStatus): string {
  return PLUGIN_STATUS_I18N_KEY[status] || 'plugin:status.unknown'
}

/**
 * 获取发布阶段的国际化 key
 * @param stage 发布阶段
 * @returns i18n key
 */
export function getPublishStageI18nKey(
  stage: ProgressEvent['stage'],
): string {
  return PUBLISH_STAGE_I18N_KEY[stage] || stage
}

/**
 * 判断插件是否已就绪（已安装且已授权）
 * @param status 插件状态
 * @returns 是否已就绪
 */
export function isPluginReady(status: PluginStatus): boolean {
  return status === PluginStatus.READY
}

/**
 * 判断插件是否已连接（兼容旧代码，等同于 isPluginReady）
 * @param status 插件状态
 * @returns 是否已连接
 */
export function isPluginConnected(status: PluginStatus): boolean {
  return status === PluginStatus.READY
}

/**
 * 判断插件是否已安装但未授权
 * @param status 插件状态
 * @returns 是否已安装未授权
 */
export function isPluginInstalledNoPermission(status: PluginStatus): boolean {
  return status === PluginStatus.INSTALLED_NO_PERMISSION
}

/**
 * 判断插件是否未安装
 * @param status 插件状态
 * @returns 是否未安装
 */
export function isPluginNotInstalled(status: PluginStatus): boolean {
  return status === PluginStatus.NOT_INSTALLED || status === PluginStatus.UNKNOWN
}

/**
 * 格式化进度百分比
 * @param progress 进度值（0-100）
 * @returns 格式化的百分比文本
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

/**
 * 验证文件类型
 * @param file 文件对象
 * @param acceptTypes 接受的文件类型数组
 * @returns 是否有效
 */
export function validateFileType(
  file: File,
  acceptTypes: string[],
): boolean {
  return acceptTypes.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2)
      return file.type.startsWith(prefix)
    }
    return file.type === type
  })
}

/**
 * 验证视频文件
 * @param file 文件对象
 * @returns 是否是有效的视频文件
 */
export function isValidVideoFile(file: File): boolean {
  return validateFileType(file, [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
  ])
}

/**
 * 验证图片文件
 * @param file 文件对象
 * @returns 是否是有效的图片文件
 */
export function isValidImageFile(file: File): boolean {
  return validateFileType(file, [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/jpg',
  ])
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSize 最大大小（字节）
 * @returns 是否在限制内
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

/**
 * 创建带重试的异步函数
 * @param fn 异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 包装后的函数
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): () => Promise<T> {
  return async () => {
    let lastError: any

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      }
      catch (error) {
        lastError = error

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }
}
