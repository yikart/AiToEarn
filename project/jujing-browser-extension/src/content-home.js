const REQUEST_TIMEOUT_MS = 120000
const PAGE_SOURCE = 'aitoearn-web'

const allowedWebHostnames = ['localhost', '127.0.0.1', 'aitoearn.cn', 'www.aitoearn.cn', 'aitoearn.ai', 'www.aitoearn.ai']

if (!allowedWebHostnames.includes(location.hostname) && !location.hostname.endsWith('.aitoearn.cn') && !location.hostname.endsWith('.aitoearn.ai')) {
  console.info('[巨鲸插件] 当前页面不是巨鲸网络 Web 入口，跳过桥接注入')
}
else {

const MessageType = {
  CHECK_PERMISSION_REQUEST: 'CHECK_PERMISSION_REQUEST',
  CHECK_PERMISSION_RESPONSE: 'CHECK_PERMISSION_RESPONSE',
  GET_VERSION_REQUEST: 'GET_VERSION_REQUEST',
  GET_VERSION_RESPONSE: 'GET_VERSION_RESPONSE',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_RESPONSE: 'LOGIN_RESPONSE',
  PUBLISH_REQUEST: 'PUBLISH_REQUEST',
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

const RuntimeAction = {
  CHECK_PERMISSION: 'JUJING_CHECK_PERMISSION',
  GET_VERSION: 'JUJING_GET_VERSION',
  LOGIN: 'JUJING_LOGIN',
  XHS_REQUEST: 'JUJING_XHS_REQUEST',
  DOUYIN_REQUEST: 'JUJING_DOUYIN_REQUEST',
  DOUYIN_INTERACTION: 'JUJING_DOUYIN_INTERACTION',
  DOUYIN_DIRECT_MESSAGE: 'JUJING_DOUYIN_DIRECT_MESSAGE',
  UNIFIED_INTERACTION: 'JUJING_UNIFIED_INTERACTION',
  PUBLISH: 'JUJING_PUBLISH',
}

const runtimeActionByType = {
  [MessageType.CHECK_PERMISSION_REQUEST]: RuntimeAction.CHECK_PERMISSION,
  [MessageType.GET_VERSION_REQUEST]: RuntimeAction.GET_VERSION,
  [MessageType.LOGIN_REQUEST]: RuntimeAction.LOGIN,
  [MessageType.XHS_REQUEST]: RuntimeAction.XHS_REQUEST,
  [MessageType.DOUYIN_REQUEST]: RuntimeAction.DOUYIN_REQUEST,
  [MessageType.DOUYIN_INTERACTION]: RuntimeAction.DOUYIN_INTERACTION,
  [MessageType.DOUYIN_DIRECT_MESSAGE]: RuntimeAction.DOUYIN_DIRECT_MESSAGE,
  [MessageType.UNIFIED_INTERACTION]: RuntimeAction.UNIFIED_INTERACTION,
  [MessageType.PUBLISH_REQUEST]: RuntimeAction.PUBLISH,
}

const responseTypeByType = {
  [MessageType.CHECK_PERMISSION_REQUEST]: MessageType.CHECK_PERMISSION_RESPONSE,
  [MessageType.GET_VERSION_REQUEST]: MessageType.GET_VERSION_RESPONSE,
  [MessageType.LOGIN_REQUEST]: MessageType.LOGIN_RESPONSE,
  [MessageType.XHS_REQUEST]: MessageType.XHS_REQUEST_RESPONSE,
  [MessageType.DOUYIN_REQUEST]: MessageType.DOUYIN_REQUEST_RESPONSE,
  [MessageType.DOUYIN_INTERACTION]: MessageType.DOUYIN_INTERACTION_RESPONSE,
  [MessageType.DOUYIN_DIRECT_MESSAGE]: MessageType.DOUYIN_DIRECT_MESSAGE_RESPONSE,
  [MessageType.UNIFIED_INTERACTION]: MessageType.UNIFIED_INTERACTION_RESPONSE,
}

function injectWebApi() {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('src/web-api.js')
  script.onload = () => script.remove()
  ;(document.head || document.documentElement).appendChild(script)
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('巨鲸插件后台响应超时'))
    }, REQUEST_TIMEOUT_MS)

    chrome.runtime.sendMessage(message, (response) => {
      window.clearTimeout(timeout)
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(new Error(lastError.message || '巨鲸插件后台不可用'))
        return
      }
      resolve(response)
    })
  })
}

async function handlePageMessage(event) {
  if (event.source !== window)
    return

  const data = event.data
  if (!data || data.source !== PAGE_SOURCE)
    return

  const action = runtimeActionByType[data.type]
  if (!action)
    return

  try {
    const response = await sendRuntimeMessage({
      action,
      payload: data.payload,
      requestId: data.requestId,
    })

    if (data.type === MessageType.PUBLISH_REQUEST) {
      if (response?.success) {
        window.postMessage({
          source: PAGE_SOURCE,
          type: MessageType.PUBLISH_COMPLETE,
          requestId: data.requestId,
          data: response,
        }, '*')
      }
      else {
        window.postMessage({
          source: PAGE_SOURCE,
          type: MessageType.PUBLISH_ERROR,
          requestId: data.requestId,
          error: {
            message: response?.error || response?.message || '发布失败',
            code: response?.code,
          },
        }, '*')
      }
      return
    }

    window.postMessage({
      source: PAGE_SOURCE,
      type: responseTypeByType[data.type],
      requestId: data.requestId,
      result: response,
    }, '*')
  }
  catch (error) {
    window.postMessage({
      source: PAGE_SOURCE,
      type: responseTypeByType[data.type],
      requestId: data.requestId,
      result: {
        success: false,
        error: error?.message || '巨鲸插件请求失败',
      },
    }, '*')
  }
}

document.documentElement.dataset.jujingExtensionBridge = 'ready'
injectWebApi()
window.addEventListener('message', handlePageMessage)
}
