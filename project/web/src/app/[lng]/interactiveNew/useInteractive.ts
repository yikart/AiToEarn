/**
 * 互动模块 Hook
 * 管理平台选择、列表数据获取、加载状态等
 */

import type { HomeFeedItem, SupportedPlatformType } from '@/store/plugin/plats/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import {
  platformManager,
  PLUGIN_SUPPORTED_PLATFORMS,
  PluginStatus,
  usePluginStore,
} from '@/store/plugin'

/** 每页数量 */
const PAGE_SIZE = 20

/**
 * 平台信息
 */
export interface PlatformInfo {
  /** 平台类型 */
  type: SupportedPlatformType
  /** 平台名称 */
  name: string
  /** 平台图标 */
  icon: string
  /** 是否已登录 */
  isLoggedIn: boolean
}

/**
 * 互动模块状态
 */
export interface InteractiveState {
  /** 当前选中的平台 */
  currentPlatform: SupportedPlatformType | null
  /** 作品列表 */
  feedList: HomeFeedItem[]
  /** 当前页码 */
  page: number
  /** 是否正在加载 */
  loading: boolean
  /** 是否正在加载更多 */
  loadingMore: boolean
  /** 是否有更多数据 */
  hasMore: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 互动模块 Hook
 */
export function useInteractive() {
  // 插件状态
  const pluginStatus = usePluginStore(state => state.status)
  const platformAccounts = usePluginStore(state => state.platformAccounts)
  const isPluginInitializing = usePluginStore(state => state.isInitializing)

  // 组件状态
  const [state, setState] = useState<InteractiveState>({
    currentPlatform: null,
    feedList: [],
    page: 1,
    loading: false,
    loadingMore: false,
    hasMore: true,
    error: null,
  })

  // 使用 ref 保存最新状态，避免闭包问题
  const stateRef = useRef(state)
  stateRef.current = state

  /**
   * 获取所有支持的平台信息
   */
  const platforms = useMemo<PlatformInfo[]>(() => {
    return PLUGIN_SUPPORTED_PLATFORMS.map((type) => {
      const platInfo = AccountPlatInfoMap.get(type)
      const account = platformAccounts[type]

      console.log(platInfo?.name)

      return {
        type,
        name: platInfo?.name || type,
        icon: typeof platInfo?.icon === 'string' ? platInfo.icon : (platInfo?.icon as any)?.src || '',
        isLoggedIn: !!account,
      }
    })
  }, [platformAccounts])

  /**
   * 获取第一个已登录的平台
   */
  const getFirstLoggedInPlatform = useCallback((): SupportedPlatformType | null => {
    // 优先选择小红书
    if (platformAccounts[PlatType.Xhs]) {
      return PlatType.Xhs
    }
    // 否则选择第一个已登录的平台
    for (const type of PLUGIN_SUPPORTED_PLATFORMS) {
      if (platformAccounts[type]) {
        return type
      }
    }
    return null
  }, [platformAccounts])

  /**
   * 检查是否有任意平台已登录
   */
  const hasAnyLoggedIn = useMemo(() => {
    return platforms.some(p => p.isLoggedIn)
  }, [platforms])

  /**
   * 插件是否就绪
   */
  const isPluginReady = pluginStatus === PluginStatus.READY

  /**
   * 加载作品列表
   */
  const loadFeedList = useCallback(async (platform: SupportedPlatformType, page: number, isRefresh = false) => {
    if (!isPluginReady)
      return

    setState(prev => ({
      ...prev,
      loading: page === 1,
      loadingMore: page > 1,
      error: null,
    }))

    try {
      const result = await platformManager.getHomeFeedList(platform, { page, size: PAGE_SIZE })

      if (result.success) {
        setState(prev => ({
          ...prev,
          feedList: isRefresh || page === 1 ? result.items : [...prev.feedList, ...result.items],
          page,
          hasMore: true, // 此接口永远有更多数据
          loading: false,
          loadingMore: false,
          error: null,
        }))
      }
      else {
        setState(prev => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: result.message || 'Loading failed',
        }))
      }
    }
    catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: error instanceof Error ? error.message : 'Loading failed',
      }))
    }
  }, [isPluginReady])

  /**
   * 切换平台
   */
  const switchPlatform = useCallback((platform: SupportedPlatformType) => {
    // 检查平台是否已登录
    const isLoggedIn = !!platformAccounts[platform]
    if (!isLoggedIn) {
      return false
    }

    setState(prev => ({
      ...prev,
      currentPlatform: platform,
      feedList: [],
      page: 1,
      hasMore: true,
      error: null,
    }))

    // 加载该平台的数据
    loadFeedList(platform, 1, true)
    return true
  }, [platformAccounts, loadFeedList])

  /**
   * 加载更多 - 使用 ref 确保获取最新状态
   */
  const loadMore = useCallback(() => {
    const { currentPlatform, loading, loadingMore, hasMore, page } = stateRef.current

    if (!currentPlatform || loading || loadingMore || !hasMore) {
      return
    }

    loadFeedList(currentPlatform, page + 1)
  }, [loadFeedList])

  /**
   * 刷新列表 - 使用 ref 确保获取最新状态
   */
  const refresh = useCallback(() => {
    const { currentPlatform } = stateRef.current
    if (!currentPlatform)
      return

    // 返回顶部
    const container = document.getElementById('interactiveScrollContainer')
    container?.scrollTo({ top: 0, behavior: 'smooth' })

    setState(prev => ({
      ...prev,
      feedList: [],
      page: 1,
      hasMore: true,
      error: null,
    }))

    loadFeedList(currentPlatform, 1, true)
  }, [loadFeedList])

  /**
   * 初始化：选择默认平台
   */
  useEffect(() => {
    if (!isPluginReady)
      return
    if (state.currentPlatform)
      return

    const defaultPlatform = getFirstLoggedInPlatform()
    if (defaultPlatform) {
      switchPlatform(defaultPlatform)
    }
  }, [isPluginReady, state.currentPlatform, getFirstLoggedInPlatform, switchPlatform])

  return {
    // 状态
    ...state,
    platforms,
    hasAnyLoggedIn,
    isPluginReady,
    isPluginInitializing,
    pluginStatus,

    // 方法
    switchPlatform,
    loadMore,
    refresh,
  }
}
