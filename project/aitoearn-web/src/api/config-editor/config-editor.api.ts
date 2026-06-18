import type { ConfigEditorConfigDto, ConfigEditorConfigVo } from './config-editor.types'
import http from '@/utils/request'

export function getConfigEditorConfigApi(silent = true) {
  return http.get<ConfigEditorConfigVo>('config', undefined, silent)
}

export function validateConfigEditorConfigApi(data: ConfigEditorConfigDto, silent = true) {
  return http.post<void>('config/validate', data, silent)
}

export function saveConfigEditorConfigApi(data: ConfigEditorConfigDto, silent = true) {
  return http.put<void>('config', data, silent)
}

export function restartConfigEditorServiceApi(silent = true) {
  return http.post<void>('config/restart', undefined, silent)
}

function getHealthCheckUrl() {
  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL?.replace(/\/+$/, '')
  if (proxyUrl)
    return `${proxyUrl}/health`

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    const url = new URL(apiUrl)
    const pathWithoutApi = url.pathname.replace(/\/api\/?$/, '')
    url.pathname = `${pathWithoutApi}/health`.replace(/\/{2,}/g, '/')
    url.search = ''
    return url.toString()
  }

  return '/health'
}

export async function checkConfigEditorServiceHealthApi(timeoutMs = 2500) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(getHealthCheckUrl(), {
      cache: 'no-store',
      signal: controller.signal,
    })
    const text = await response.text().catch(() => '')
    return response.ok && (!text.trim() || text.trim() === 'OK')
  }
  catch {
    return false
  }
  finally {
    clearTimeout(timeoutId)
  }
}
