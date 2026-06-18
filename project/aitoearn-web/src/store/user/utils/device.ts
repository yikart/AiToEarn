export type ClientDeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown'

export interface ClientDeviceInfo {
  deviceType: ClientDeviceType
  os?: string
  browser?: string
}

interface NavigatorUserAgentData {
  mobile?: boolean
  platform?: string
}

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: NavigatorUserAgentData
}

function getRawBrowserUserAgent() {
  if (typeof window === 'undefined')
    return ''

  return window.navigator.userAgent || ''
}

function getNavigatorWithUserAgentData(): NavigatorWithUserAgentData | undefined {
  if (typeof window === 'undefined')
    return undefined

  return window.navigator as NavigatorWithUserAgentData
}

function isIpadOsDesktopMode(userAgent: string, platform: string, maxTouchPoints: number) {
  return /macintosh|mac os x/i.test(userAgent) && /mac/i.test(platform) && maxTouchPoints > 1
}

function detectClientDeviceType(userAgent: string, navigatorInfo: NavigatorWithUserAgentData): ClientDeviceType {
  const platform = navigatorInfo.userAgentData?.platform || navigatorInfo.platform || ''
  const maxTouchPoints = navigatorInfo.maxTouchPoints || 0
  const mobileFromUserAgentData = navigatorInfo.userAgentData?.mobile
  const hasCoarsePointer = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false
  const screenWidth = typeof window !== 'undefined' ? window.screen.width || window.innerWidth : 0
  const screenHeight = typeof window !== 'undefined' ? window.screen.height || window.innerHeight : 0
  const minScreenSize = Math.min(screenWidth, screenHeight)

  if (isIpadOsDesktopMode(userAgent, platform, maxTouchPoints))
    return 'tablet'

  if (/ipad|tablet|kindle|silk|playbook|nexus 7|nexus 9|sm-t|tab/i.test(userAgent))
    return 'tablet'

  if (/android/i.test(userAgent) && !/mobile/i.test(userAgent))
    return 'tablet'

  if (mobileFromUserAgentData === true)
    return 'mobile'

  if (/mobi|iphone|ipod|blackberry|iemobile|opera mini|phone/i.test(userAgent))
    return 'mobile'

  if (mobileFromUserAgentData === false)
    return 'desktop'

  if (/windows nt|macintosh|x11|linux x86_64|cros/i.test(userAgent))
    return 'desktop'

  if (hasCoarsePointer && minScreenSize > 0 && minScreenSize < 768)
    return 'mobile'

  return 'unknown'
}

function detectClientOs(userAgent: string, navigatorInfo: NavigatorWithUserAgentData) {
  const platform = navigatorInfo.userAgentData?.platform || navigatorInfo.platform || ''
  const maxTouchPoints = navigatorInfo.maxTouchPoints || 0

  if (isIpadOsDesktopMode(userAgent, platform, maxTouchPoints))
    return 'iPadOS'

  if (/iphone|ipad|ipod/i.test(userAgent))
    return 'iOS'

  if (/android/i.test(userAgent))
    return 'Android'

  if (/windows nt/i.test(userAgent))
    return 'Windows'

  if (/mac os x|macintosh/i.test(userAgent))
    return 'macOS'

  if (/cros/i.test(userAgent))
    return 'Chrome OS'

  if (/linux/i.test(userAgent))
    return 'Linux'

  return undefined
}

function detectClientBrowser(userAgent: string) {
  if (/edgios|edga|edg\//i.test(userAgent))
    return 'Edge'

  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent))
    return 'Opera'

  if (/crios/i.test(userAgent))
    return 'Chrome'

  if (/fxios/i.test(userAgent))
    return 'Firefox'

  if (/firefox\//i.test(userAgent))
    return 'Firefox'

  if (/samsungbrowser/i.test(userAgent))
    return 'Samsung Browser'

  if (/chrome\//i.test(userAgent) || /chromium/i.test(userAgent))
    return 'Chrome'

  if (/safari\//i.test(userAgent))
    return 'Safari'

  if (/msie|trident/i.test(userAgent))
    return 'Internet Explorer'

  return undefined
}

export function getClientDeviceInfo(): ClientDeviceInfo {
  const navigatorInfo = getNavigatorWithUserAgentData()
  if (!navigatorInfo) {
    return { deviceType: 'unknown' }
  }

  const userAgent = getRawBrowserUserAgent()

  return {
    deviceType: detectClientDeviceType(userAgent, navigatorInfo),
    os: detectClientOs(userAgent, navigatorInfo),
    browser: detectClientBrowser(userAgent),
  }
}
