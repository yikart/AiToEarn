/**
 * 浏览器插件相关的自定义 Hooks
 */

'use client'

import type {
  OperationResult,
  PlatformType,
  ProgressCallback,
  PublishParams,
} from './types/types'
import { useCallback, useEffect } from 'react'
import { DEFAULT_POLLING_INTERVAL } from './constants'
import { usePluginStore } from './store'
import { PluginStatus } from './types/types'

/**
 * 使用插件状态和方法的 Hook
 * @param autoPolling 是否自动轮询插件状态，默认 true
 * @param pollingInterval 轮询间隔（毫秒），默认 2000ms
 */
export function usePlugin(
  autoPolling = true,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
) {
  const {
    status,
    isPublishing,
    publishProgress,
    checkPlugin,
    startPolling,
    stopPolling,
    login,
    publish,
    resetPublishState,
  } = usePluginStore()

  // 自动轮询
  useEffect(() => {
    if (autoPolling) {
      startPolling(pollingInterval)
      return () => {
        stopPolling()
      }
    }
  }, [autoPolling, pollingInterval, startPolling, stopPolling])

  // 判断插件是否已连接
  const isConnected = status === PluginStatus.CONNECTED

  // 判断插件是否未安装
  const isNotInstalled = status === PluginStatus.NOT_INSTALLED

  // 判断是否正在检测
  const isChecking = status === PluginStatus.CHECKING

  return {
    // 状态
    status,
    isConnected,
    isNotInstalled,
    isChecking,
    isPublishing,
    publishProgress,

    // 方法
    checkPlugin,
    startPolling,
    stopPolling,
    login,
    publish,
    resetPublishState,
  }
}

/**
 * 使用平台登录的 Hook
 */
export function usePluginLogin() {
  const { login } = usePluginStore()

  /**
   * 登录到指定平台
   * @param platform 平台类型
   * @returns Promise<账号信息>
   */
  const loginToPlatform = useCallback(
    async (platform: PlatformType) => {
      try {
        const accountInfo = await login(platform)
        return { success: true, data: accountInfo } as OperationResult
      }
      catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '登录失败',
        } as OperationResult
      }
    },
    [login],
  )

  return {
    login: loginToPlatform,
  }
}

/**
 * 使用发布功能的 Hook
 */
export function usePluginPublish() {
  const { publish, isPublishing, publishProgress, resetPublishState }
    = usePluginStore()

  /**
   * 发布内容
   * @param params 发布参数
   * @param onProgress 进度回调
   * @returns Promise<发布结果>
   */
  const publishContent = useCallback(
    async (params: PublishParams, onProgress?: ProgressCallback) => {
      try {
        const result = await publish(params, onProgress)
        return { success: true, data: result } as OperationResult
      }
      catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '发布失败',
        } as OperationResult
      }
    },
    [publish],
  )

  /**
   * 发布视频
   */
  const publishVideo = useCallback(
    async (
      platform: PlatformType,
      video: File | string,
      cover: File | string,
      options: {
        title?: string
        desc?: string
        topics?: string[]
        visibility?: 'public' | 'private' | 'friends'
      } = {},
      onProgress?: ProgressCallback,
    ) => {
      return publishContent(
        {
          platform,
          type: 'video',
          video,
          cover,
          ...options,
        },
        onProgress,
      )
    },
    [publishContent],
  )

  /**
   * 发布图文
   */
  const publishImages = useCallback(
    async (
      platform: PlatformType,
      images: (File | string)[],
      options: {
        title?: string
        desc?: string
        topics?: string[]
        visibility?: 'public' | 'private' | 'friends'
      } = {},
      onProgress?: ProgressCallback,
    ) => {
      return publishContent(
        {
          platform,
          type: 'image',
          images,
          ...options,
        },
        onProgress,
      )
    },
    [publishContent],
  )

  return {
    publish: publishContent,
    publishVideo,
    publishImages,
    isPublishing,
    publishProgress,
    resetPublishState,
  }
}

/**
 * 完整的插件工作流 Hook（登录 + 发布）
 */
export function usePluginWorkflow() {
  const { isConnected } = usePlugin()
  const { login } = usePluginLogin()
  const { publishVideo, publishImages } = usePluginPublish()

  /**
   * 登录并发布视频
   */
  const loginAndPublishVideo = useCallback(
    async (
      platform: PlatformType,
      video: File | string,
      cover: File | string,
      options: {
        title?: string
        desc?: string
        topics?: string[]
      } = {},
      onProgress?: ProgressCallback,
    ) => {
      // 第一步：登录
      const loginResult = await login(platform)
      if (!loginResult.success) {
        return loginResult
      }

      // 第二步：发布
      return publishVideo(platform, video, cover, options, onProgress)
    },
    [login, publishVideo],
  )

  /**
   * 登录并发布图文
   */
  const loginAndPublishImages = useCallback(
    async (
      platform: PlatformType,
      images: (File | string)[],
      options: {
        title?: string
        desc?: string
        topics?: string[]
      } = {},
      onProgress?: ProgressCallback,
    ) => {
      // 第一步：登录
      const loginResult = await login(platform)
      if (!loginResult.success) {
        return loginResult
      }

      // 第二步：发布
      return publishImages(platform, images, options, onProgress)
    },
    [login, publishImages],
  )

  return {
    isConnected,
    loginAndPublishVideo,
    loginAndPublishImages,
  }
}
