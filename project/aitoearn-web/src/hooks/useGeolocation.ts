/**
 * useGeolocation - 获取用户地理位置 Hook
 * 使用浏览器 Geolocation API 获取用户当前位置
 */

import { useCallback, useEffect, useState } from 'react'

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported'
export type GeolocationErrorCode = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported' | 'unknown'

export interface GeolocationState {
  /** 纬度 */
  latitude: number | null
  /** 经度 */
  longitude: number | null
  /** 精度（米） */
  accuracy: number | null
  /** 错误信息 */
  error: string | null
  /** 错误码 */
  errorCode: GeolocationErrorCode | null
  /** 是否正在加载 */
  loading: boolean
  /** 当前定位状态 */
  status: GeolocationStatus
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
    errorCode: null,
    loading: false,
    status: 'idle',
  })

  const getPositionAsync = useCallback(() => {
    return new Promise<GeolocationState>((resolve) => {
      // 检查浏览器是否支持 Geolocation
      if (!navigator.geolocation) {
        const nextState: GeolocationState = {
          latitude: null,
          longitude: null,
          accuracy: null,
          error: 'Geolocation is not supported by this browser',
          errorCode: 'unsupported',
          loading: false,
          status: 'unsupported',
        }
        setState(nextState)
        resolve(nextState)
        return
      }

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        errorCode: null,
        status: 'loading',
      }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextState: GeolocationState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            errorCode: null,
            loading: false,
            status: 'granted',
          }
          setState(nextState)
          resolve(nextState)
        },
        (error) => {
          let errorMessage: string
          let errorCode: GeolocationErrorCode
          let status: GeolocationStatus
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'User denied the request for geolocation'
              errorCode = 'permission_denied'
              status = 'denied'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable'
              errorCode = 'position_unavailable'
              status = 'error'
              break
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out'
              errorCode = 'timeout'
              status = 'error'
              break
            default:
              errorMessage = 'An unknown error occurred'
              errorCode = 'unknown'
              status = 'error'
          }
          const nextState: GeolocationState = {
            latitude: null,
            longitude: null,
            accuracy: null,
            error: errorMessage,
            errorCode,
            loading: false,
            status,
          }
          setState(nextState)
          resolve(nextState)
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      )
    })
  }, [enableHighAccuracy, timeout, maximumAge])

  const getPosition = useCallback(() => {
    void getPositionAsync()
  }, [getPositionAsync])

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
    /** 刷新位置并等待本次定位结果 */
    refreshAsync: getPositionAsync,
  }
}
