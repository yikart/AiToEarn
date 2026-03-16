/**
 * useGeolocation - 获取用户地理位置 Hook
 * 使用浏览器 Geolocation API 获取用户当前位置
 */

import { useCallback, useEffect, useState } from 'react'

export interface GeolocationState {
  /** 纬度 */
  latitude: number | null
  /** 经度 */
  longitude: number | null
  /** 精度（米） */
  accuracy: number | null
  /** 错误信息 */
  error: string | null
  /** 是否正在加载 */
  loading: boolean
}

export interface UseGeolocationOptions {
  /** 是否在挂载时自动获取位置 */
  enableOnMount?: boolean
  /** 位置精度要求 */
  enableHighAccuracy?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
  /** 缓存时间（毫秒） */
  maximumAge?: number
}

const defaultOptions: UseGeolocationOptions = {
  enableOnMount: false, // 默认不自动获取，由调用方决定时机
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5 * 60 * 1000, // 5分钟缓存
}

/**
 * 获取用户地理位置
 * @param options 配置选项
 * @returns 地理位置状态和刷新方法
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableOnMount, enableHighAccuracy, timeout, maximumAge } = {
    ...defaultOptions,
    ...options,
  }

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const getPosition = useCallback(() => {
    // 检查浏览器是否支持 Geolocation
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage: string
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out'
            break
          default:
            errorMessage = 'An unknown error occurred'
        }
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    )
  }, [enableHighAccuracy, timeout, maximumAge])

  // 挂载时自动获取位置
  useEffect(() => {
    if (enableOnMount) {
      getPosition()
    }
  }, [enableOnMount, getPosition])

  return {
    ...state,
    /** 刷新位置 */
    refresh: getPosition,
  }
}
