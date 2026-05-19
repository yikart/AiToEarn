(() => {
  const PAGE_SOURCE = 'aitoearn-web'
  const REQUEST_TIMEOUT_MS = 120000

  const MessageType = {
    CHECK_PERMISSION_REQUEST: 'CHECK_PERMISSION_REQUEST',
    CHECK_PERMISSION_RESPONSE: 'CHECK_PERMISSION_RESPONSE',
    GET_VERSION_REQUEST: 'GET_VERSION_REQUEST',
    GET_VERSION_RESPONSE: 'GET_VERSION_RESPONSE',
    LOGIN_REQUEST: 'LOGIN_REQUEST',
    LOGIN_RESPONSE: 'LOGIN_RESPONSE',
    PUBLISH_REQUEST: 'PUBLISH_REQUEST',
    PUBLISH_PROGRESS: 'PUBLISH_PROGRESS',
    PUBLISH_COMPLETE: 'PUBLISH_COMPLETE',
    PUBLISH_ERROR: 'PUBLISH_ERROR',
    XHS_REQUEST: 'XHS_REQUEST',
    XHS_REQUEST_RESPONSE: 'XHS_REQUEST_RESPONSE',
    DOUYIN_REQUEST: 'DOUYIN_REQUEST',
    DOUYIN_REQUEST_RESPONSE: 'DOUYIN_REQUEST_RESPONSE',
    DOUYIN_INTERACTION: 'DOUYIN_INTERACTION',
    DOUYIN_INTERACTION_RESPONSE: 'DOUYIN_INTERACTION_RESPONSE',
    DOUYIN_DIRECT_MESSAGE: 'DOUYIN_DIRECT_MESSAGE',
    DOUYIN_DIRECT_MESSAGE_RESPONSE: 'DOUYIN_DIRECT_MESSAGE_RESPONSE',
    UNIFIED_INTERACTION: 'UNIFIED_INTERACTION',
    UNIFIED_INTERACTION_RESPONSE: 'UNIFIED_INTERACTION_RESPONSE',
  }

  function createRequestId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`
  }

  function request(type, responseType, payload, timeoutMs = REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const requestId = createRequestId()
      const timeout = window.setTimeout(() => {
        window.removeEventListener('message', listener)
        reject(new Error('巨鲸插件请求超时'))
      }, timeoutMs)

      function listener(event) {
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
        source: PAGE_SOURCE,
        type,
        requestId,
        payload,
      }, '*')
    })
  }

  class JuJingPluginApi {
    checkPermission() {
      return request(MessageType.CHECK_PERMISSION_REQUEST, MessageType.CHECK_PERMISSION_RESPONSE)
    }

    getVersion() {
      return request(MessageType.GET_VERSION_REQUEST, MessageType.GET_VERSION_RESPONSE)
    }

    async login(platform) {
      const result = await request(MessageType.LOGIN_REQUEST, MessageType.LOGIN_RESPONSE, { platform })
      if (result?.success)
        return result.data ?? result

      const error = new Error(result?.error || result?.message || '登录失败')
      error.code = result?.code
      throw error
    }

    publish(params, onProgress) {
      return new Promise((resolve, reject) => {
        const requestId = createRequestId()
        const timeout = window.setTimeout(() => {
          window.removeEventListener('message', listener)
          reject(new Error('发布请求超时'))
        }, REQUEST_TIMEOUT_MS)

        function listener(event) {
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
          source: PAGE_SOURCE,
          type: MessageType.PUBLISH_REQUEST,
          requestId,
          payload: params,
        }, '*')
      })
    }

    async xhsRequest(params) {
      const result = await request(MessageType.XHS_REQUEST, MessageType.XHS_REQUEST_RESPONSE, params)
      if (result?.success)
        return result.data
      throw new Error(result?.error || result?.message || '小红书请求失败')
    }

    async douyinRequest(params) {
      const result = await request(MessageType.DOUYIN_REQUEST, MessageType.DOUYIN_REQUEST_RESPONSE, params)
      if (result?.success)
        return result.data
      throw new Error(result?.error || result?.message || '抖音请求失败')
    }

    douyinInteraction(params) {
      return request(MessageType.DOUYIN_INTERACTION, MessageType.DOUYIN_INTERACTION_RESPONSE, params)
    }

    douyinDirectMessage(params) {
      return request(MessageType.DOUYIN_DIRECT_MESSAGE, MessageType.DOUYIN_DIRECT_MESSAGE_RESPONSE, params)
    }

    unifiedInteraction(params) {
      return request(MessageType.UNIFIED_INTERACTION, MessageType.UNIFIED_INTERACTION_RESPONSE, params)
    }
  }

  window.AIToEarnPlugin = new JuJingPluginApi()
  window.JuJingBrowserBridge = window.AIToEarnPlugin
  document.documentElement.dataset.jujingPluginApi = 'ready'
  window.dispatchEvent(new CustomEvent('jujing-plugin-ready', {
    detail: { version: '0.1.0' },
  }))
})()
