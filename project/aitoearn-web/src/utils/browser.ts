/**
 * 浏览器环境判断工具
 */

function getBrowserUserAgent() {
  if (typeof window === 'undefined')
    return ''

  return window.navigator.userAgent.toLowerCase()
}

/**
 * 判断当前页面是否运行在微信内置浏览器或 WebView 中。
 */
export function isWechatWebView() {
  return getBrowserUserAgent().includes('micromessenger')
}

/**
 * 判断当前页面是否运行在支付宝内置浏览器或 WebView 中。
 */
export function isAlipayWebView() {
  return getBrowserUserAgent().includes('alipayclient')
}

/**
 * 判断当前页面是否运行在需要提示切换系统浏览器的 App 内置浏览器中。
 */
export function isBrowserOpenGuideWebView() {
  return isWechatWebView() || isAlipayWebView()
}
