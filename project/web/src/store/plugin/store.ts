/**
 * 浏览器插件状态管理 Store
 */

import type {
  PlatformType,
  PluginStatus,
  PluginStore,
  ProgressCallback,
  PublishParams,
} from '@/store'
import { create } from 'zustand'
import { DEFAULT_POLLING_INTERVAL, ERROR_MESSAGES } from './constants'
import { PluginStatus as Status } from './types/types'

/**
 * 创建插件管理 Store
 */
export const usePluginStore = create<PluginStore>((set, get) => ({
  // ==================== 状态 ====================
  status: Status.UNKNOWN,
  pollingTimer: null,
  isPublishing: false,
  publishProgress: null,

  // ==================== 方法 ====================

  /**
   * 检查插件是否可用
   * @returns 插件是否可用
   */
  checkPlugin: () => {
    const isAvailable
      = typeof window !== 'undefined' && !!window.AIToEarnPlugin

    set({
      status: isAvailable ? Status.CONNECTED : Status.NOT_INSTALLED,
    })

    return isAvailable
  },

  /**
   * 开始轮询插件状态
   * @param interval 轮询间隔（毫秒），默认 2000ms
   */
  startPolling: (interval = DEFAULT_POLLING_INTERVAL) => {
    const { pollingTimer, stopPolling, checkPlugin } = get()

    // 如果已有轮询，先停止
    if (pollingTimer) {
      stopPolling()
    }

    // 立即执行一次检查
    set({ status: Status.CHECKING })
    checkPlugin()

    // 开始轮询
    const timer = setInterval(() => {
      checkPlugin()
    }, interval)

    set({ pollingTimer: timer })
  },

  /**
   * 停止轮询插件状态
   */
  stopPolling: () => {
    const { pollingTimer } = get()

    if (pollingTimer) {
      clearInterval(pollingTimer)
      set({ pollingTimer: null })
    }
  },

  /**
   * 登录到指定平台
   * @param platform 平台类型
   * @returns Promise<账号信息>
   */
  login: async (platform: PlatformType) => {
    const { checkPlugin } = get()

    // 检查插件是否可用
    if (!checkPlugin()) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)
    }

    try {
      const result = await window.AIToEarnPlugin!.login(platform)
      return result
    }
    catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  /**
   * 发布内容到指定平台
   * @param params 发布参数
   * @param onProgress 进度回调函数
   * @returns Promise<发布结果>
   */
  publish: async (params: PublishParams, onProgress?: ProgressCallback) => {
    const { checkPlugin } = get()

    // 检查插件是否可用
    if (!checkPlugin()) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)
    }

    // 检查是否正在发布
    if (get().isPublishing) {
      throw new Error(ERROR_MESSAGES.PUBLISHING_IN_PROGRESS)
    }

    // 设置发布状态
    set({
      isPublishing: true,
      publishProgress: {
        stage: 'download',
        progress: 0,
        message: '准备发布...',
        timestamp: Date.now(),
      },
    })

    try {
      // 调用插件发布方法
      const result = await window.AIToEarnPlugin!.publish(
        params,
        (progress) => {
          // 更新内部进度状态
          set({ publishProgress: progress })

          // 调用外部回调
          if (onProgress) {
            onProgress(progress)
          }
        },
      )

      // 发布完成，更新状态
      set({
        isPublishing: false,
        publishProgress: {
          stage: 'complete',
          progress: 100,
          message: '发布成功',
          timestamp: Date.now(),
        },
      })

      return result
    }
    catch (error) {
      // 发布失败，更新状态
      set({
        isPublishing: false,
        publishProgress: {
          stage: 'error',
          progress: 0,
          message: error instanceof Error ? error.message : '发布失败',
          timestamp: Date.now(),
        },
      })

      console.error('发布失败:', error)
      throw error
    }
  },

  /**
   * 重置发布状态
   */
  resetPublishState: () => {
    set({
      isPublishing: false,
      publishProgress: null,
    })
  },
}))
