/**
 * appLaunch - App 唤起工具
 * 通过多策略（iframe + location.href + 超时降级）唤起移动端 App
 */

/**
 * 通过 API URL 唤起 App（API 会 302 重定向到 scheme URL）
 * 多策略：iframe 唤起 + location.href 备选 + 超时降级
 */
export function openApp(apiUrl: string, onFailed: () => void) {
  const timeout = 2500
  let timer: ReturnType<typeof setTimeout> | null = null
  let hidden = false

  const onVisibilityChange = () => {
    if (document.hidden) {
      hidden = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  // 策略1：iframe 唤起（浏览器跟随 302 重定向到 scheme URL）
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = apiUrl
  document.body.appendChild(iframe)
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe)
    }
  }, 1000)

  // 策略2：location.href 备选（延迟 200ms，给 iframe 优先机会）
  setTimeout(() => {
    if (!hidden) {
      window.location.href = apiUrl
    }
  }, 200)

  // 超时检测：如果页面仍在前台，说明唤起失败
  timer = setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (!hidden) {
      onFailed()
    }
  }, timeout)
}
