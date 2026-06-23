import type { ConfigEditorConfigDto, ConfigEditorConfigVo } from './config-editor.types'
import http from '@/utils/request'
import { ConfigEditorServiceTarget } from './config-editor.types'

function getConfigEditorRoute(target: ConfigEditorServiceTarget, path = '') {
  const baseRoute = target === ConfigEditorServiceTarget.Ai ? 'ai/config' : 'config'
  return path ? `${baseRoute}/${path}` : baseRoute
}

export function getConfigEditorConfigApi(target = ConfigEditorServiceTarget.Server, silent = true) {
  return http.get<ConfigEditorConfigVo>(getConfigEditorRoute(target), undefined, silent)
}

export function validateConfigEditorConfigApi(data: ConfigEditorConfigDto, target = ConfigEditorServiceTarget.Server, silent = true) {
  return http.post<void>(getConfigEditorRoute(target, 'validate'), data, silent)
}

export function saveConfigEditorConfigApi(data: ConfigEditorConfigDto, target = ConfigEditorServiceTarget.Server, silent = true) {
  return http.put<void>(getConfigEditorRoute(target), data, silent)
}

export function restartConfigEditorServiceApi(target = ConfigEditorServiceTarget.Server, silent = true) {
  return http.post<void>(getConfigEditorRoute(target, 'restart'), undefined, silent)
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

export async function checkConfigEditorConfigReadyApi(target = ConfigEditorServiceTarget.Server, timeoutMs = 2500) {
  if (target === ConfigEditorServiceTarget.Server)
    return checkConfigEditorServiceHealthApi(timeoutMs)

  const timeout = new Promise<false>(resolve => setTimeout(() => resolve(false), timeoutMs))
  const readiness = getConfigEditorConfigApi(target, true)
    .then(response => !!response && response.code === 0)
    .catch(() => false)

  return Promise.race([readiness, timeout])
}
