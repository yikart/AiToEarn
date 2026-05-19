/**
 * 浏览器环境判断工具
 */

/**
 * 判断当前页面是否运行在微信内置浏览器或 WebView 中。
 */
export function isWechatWebView() {
  if (typeof window === 'undefined')
    return false

  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('micromessenger')
}
