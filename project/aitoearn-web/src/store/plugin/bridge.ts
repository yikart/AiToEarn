import type { AIToEarnPluginAPI } from './types/baseTypes'

const PAGE_SOURCE = 'aitoearn-web'
const REQUEST_TIMEOUT_MS = 120000
const DEFAULT_BRIDGE_WAIT_MS = 6000
const BRIDGE_POLL_INTERVAL_MS = 250

const MessageType = {
  CHECK_PERMISSION_REQUEST: 'CHECK_PERMISSION_REQUEST',
  CHECK_PERMISSION_RESPONSE: 'CHECK_PERMISSION_RESPONSE',
  DOUYIN_DIRECT_MESSAGE: 'DOUYIN_DIRECT_MESSAGE',
  DOUYIN_DIRECT_MESSAGE_RESPONSE: 'DOUYIN_DIRECT_MESSAGE_RESPONSE',
  DOUYIN_INTERACTION: 'DOUYIN_INTERACTION',
  DOUYIN_INTERACTION_RESPONSE: 'DOUYIN_INTERACTION_RESPONSE',
  DOUYIN_REQUEST: 'DOUYIN_REQUEST',
  DOUYIN_REQUEST_RESPONSE: 'DOUYIN_REQUEST_RESPONSE',
  GET_VERSION_REQUEST: 'GET_VERSION_REQUEST',
  GET_VERSION_RESPONSE: 'GET_VERSION_RESPONSE',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_RESPONSE: 'LOGIN_RESPONSE',
  PUBLISH_COMPLETE: 'PUBLISH_COMPLETE',
  PUBLISH_ERROR: 'PUBLISH_ERROR',
  PUBLISH_PROGRESS: 'PUBLISH_PROGRESS',
  PUBLISH_REQUEST: 'PUBLISH_REQUEST',
  REMOTE_AUTOMATION_RUN: 'REMOTE_AUTOMATION_RUN',
  REMOTE_AUTOMATION_RUN_RESPONSE: 'REMOTE_AUTOMATION_RUN_RESPONSE',
  UNIFIED_INTERACTION: 'UNIFIED_INTERACTION',
  UNIFIED_INTERACTION_RESPONSE: 'UNIFIED_INTERACTION_RESPONSE',
  XHS_REQUEST: 'XHS_REQUEST',
  XHS_REQUEST_RESPONSE: 'XHS_REQUEST_RESPONSE',
} as const

function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function request<T = any>(type: string, responseType: string, payload?: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', listener)
      reject(new Error('巨鲸插件请求超时'))
    }, timeoutMs)

    function listener(event: MessageEvent) {
      if (event.source !== window)
        return

      const data = event.data
      if (!data || data.source !== PAGE_SOURCE)
        return

      if (data.requestId !== requestId || data.type !== responseType)
        return

      window.clearTimeout(timeout)
      window.removeEventListener('message', listener)
      resolve(data.result ?? data.data)
    }

    window.addEventListener('message', listener)
    window.postMessage({
      payload,
      requestId,
      source: PAGE_SOURCE,
      type,
    }, '*')
  })
}

function createPageBridge(): AIToEarnPluginAPI {
  return {
    async checkPermission() {
      return request(MessageType.CHECK_PERMISSION_REQUEST, MessageType.CHECK_PERMISSION_RESPONSE)
    },
    async douyinDirectMessage(params) {
      return request(MessageType.DOUYIN_DIRECT_MESSAGE, MessageType.DOUYIN_DIRECT_MESSAGE_RESPONSE, params)
    },
    async douyinInteraction(params) {
      return request(MessageType.DOUYIN_INTERACTION, MessageType.DOUYIN_INTERACTION_RESPONSE, params)
    },
    async douyinRequest(params) {
      const result = await request<any>(MessageType.DOUYIN_REQUEST, MessageType.DOUYIN_REQUEST_RESPONSE, params)
      if (result?.success)
        return result.data
      throw new Error(result?.error || result?.message || '抖音请求失败')
    },
    async getVersion() {
      return request(MessageType.GET_VERSION_REQUEST, MessageType.GET_VERSION_RESPONSE)
    },
    async login(platform) {
      const result = await request<any>(MessageType.LOGIN_REQUEST, MessageType.LOGIN_RESPONSE, { platform })
      if (result?.success)
        return result.data ?? result

      const error = new Error(result?.error || result?.message || '登录失败') as Error & { code?: string }
      error.code = result?.code
      throw error
    },
    publish(params, onProgress) {
      return new Promise((resolve, reject) => {
        const requestId = createRequestId()
        const timeout = window.setTimeout(() => {
          window.removeEventListener('message', listener)
          reject(new Error('发布请求超时'))
        }, REQUEST_TIMEOUT_MS)

        function listener(event: MessageEvent) {
          if (event.source !== window)
            return

          const data = event.data
          if (!data || data.source !== PAGE_SOURCE || data.requestId !== requestId)
            return

          if (data.type === MessageType.PUBLISH_PROGRESS) {
            onProgress?.(data.data)
            return
          }

          window.clearTimeout(timeout)
          window.removeEventListener('message', listener)

          if (data.type === MessageType.PUBLISH_COMPLETE)
            resolve(data.data)
          else if (data.type === MessageType.PUBLISH_ERROR)
            reject(new Error(data.error?.message || '发布失败'))
        }

        window.addEventListener('message', listener)
        window.postMessage({
          payload: params,
          requestId,
          source: PAGE_SOURCE,
          type: MessageType.PUBLISH_REQUEST,
        }, '*')
      })
    },
    unifiedInteraction(params) {
      return request(MessageType.UNIFIED_INTERACTION, MessageType.UNIFIED_INTERACTION_RESPONSE, params)
    },
    remoteAutomationRun(params) {
      return request(MessageType.REMOTE_AUTOMATION_RUN, MessageType.REMOTE_AUTOMATION_RUN_RESPONSE, params, params.timeout || REQUEST_TIMEOUT_MS)
    },
    async xhsRequest(params) {
      const result = await request<any>(MessageType.XHS_REQUEST, MessageType.XHS_REQUEST_RESPONSE, params)
      if (result?.success)
        return result.data
      throw new Error(result?.error || result?.message || '小红书请求失败')
    },
  }
}

function isCustomExtensionBridgeReady() {
  return document.documentElement.dataset.jujingExtensionBridge === 'ready'
}

function getPluginBridge() {
  if (window.AIToEarnPlugin?.remoteAutomationRun)
    return window.AIToEarnPlugin

  if (window.AIToEarnPlugin && !window.__AIToEarnMessageBridge)
    window.__AIToEarnMessageBridge = createPageBridge()

  if (window.__AIToEarnMessageBridge)
    return window.__AIToEarnMessageBridge

  if (!isCustomExtensionBridgeReady())
    return null

  window.__AIToEarnMessageBridge = createPageBridge()
  window.AIToEarnPlugin = window.__AIToEarnMessageBridge
  window.JuJingBrowserBridge = window.__AIToEarnMessageBridge
  return window.__AIToEarnMessageBridge
}

export function ensurePluginBridge() {
  if (typeof window === 'undefined')
    return null

  return getPluginBridge()
}

export function waitForPluginBridge(timeoutMs = DEFAULT_BRIDGE_WAIT_MS): Promise<AIToEarnPluginAPI | null> {
  if (typeof window === 'undefined')
    return Promise.resolve(null)

  const current = getPluginBridge()
  if (current)
    return Promise.resolve(current)

  return new Promise((resolve) => {
    const startedAt = Date.now()
    let timer: number | null = null

    const cleanup = () => {
      if (timer)
        window.clearTimeout(timer)
      window.removeEventListener('jujing-plugin-ready', check)
      window.removeEventListener('aitoearn-plugin-ready', check)
    }

    function check() {
      const plugin = getPluginBridge()
      if (plugin) {
        cleanup()
        resolve(plugin)
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        cleanup()
        resolve(null)
        return
      }

      timer = window.setTimeout(check, BRIDGE_POLL_INTERVAL_MS)
    }

    window.addEventListener('jujing-plugin-ready', check)
    window.addEventListener('aitoearn-plugin-ready', check)
    timer = window.setTimeout(check, BRIDGE_POLL_INTERVAL_MS)
  })
}
