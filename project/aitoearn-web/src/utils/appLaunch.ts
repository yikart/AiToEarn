/**
 * appLaunch - App 唤起工具
 * 通过多策略（iframe + location.href + 超时降级）唤起移动端 App
 */

interface LaunchUrlOptions {
  timeout?: number
  fallbackUrl?: string
  onFailed?: () => void
}

function launchUrl(url: string, options: LaunchUrlOptions = {}) {
  const { timeout = 2500, fallbackUrl, onFailed } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let hidden = false
  let cleaned = false

  const cleanup = () => {
    if (cleaned)
      return

    cleaned = true
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)

    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const markHidden = () => {
    hidden = true
    cleanup()
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      markHidden()
    }
  }

  const onPageHide = () => {
    markHidden()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)

  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = url
  document.body.appendChild(iframe)
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }, 1000)

  setTimeout(() => {
    if (!hidden) {
      window.location.href = url
    }
  }, 200)

  timer = setTimeout(() => {
    cleanup()

    if (!hidden) {
      if (fallbackUrl) {
        window.location.href = fallbackUrl
      }
      onFailed?.()
    }
  }, timeout)
}

/**
 * 通过 API URL 唤起 App（API 会 302 重定向到 scheme URL）
 * 多策略：iframe 唤起 + location.href 备选 + 超时降级
 */
export function openApp(apiUrl: string, onFailed: () => void) {
  launchUrl(apiUrl, { onFailed })
}

/**
 * 通过 deeplink 或 scheme URL 唤起 App
 * 适用于前端已拿到最终唤起链接的场景，如小红书分享 deeplink
 */
export function openDeepLink(url: string, options: LaunchUrlOptions = {}) {
  launchUrl(url, options)
}
