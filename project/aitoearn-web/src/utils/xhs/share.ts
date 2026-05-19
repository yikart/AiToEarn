import { openDeepLink } from '@/utils/appLaunch'

const XHS_CHECK_TOKEN_URL = 'https://edith.xiaohongshu.com/api/sns/v1/ext/check/token'
const XHS_UNIVERSAL_LINK = 'https://oia.xiaohongshu.com/oia'
const XHS_URL_SCHEMA = 'xhsdiscover://js_share_sdk'

export interface XhsShareInfo {
  type: 'normal' | 'video'
  title?: string
  content?: string
  images?: string[]
  video?: string
  cover?: string
}

export interface XhsShareVerifyConfig {
  appKey: string
  nonce: string
  timestamp: string
  signature: string
}

export interface XhsShareLinks {
  universalLink: string
  urlSchema: string
}

interface XhsCheckTokenResponse {
  success?: boolean
  msg?: string
  data?: {
    data_code?: string
  }
}

function isHttpUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://')
}

function validateShareInfo(shareInfo: XhsShareInfo) {
  if (shareInfo.type === 'normal') {
    if (!shareInfo.images?.length || !shareInfo.images.every(isHttpUrl)) {
      throw new Error('Invalid Xiaohongshu images payload')
    }
  }

  if (shareInfo.type === 'video') {
    if (!shareInfo.video || !isHttpUrl(shareInfo.video)) {
      throw new Error('Invalid Xiaohongshu video payload')
    }
  }

  if (shareInfo.cover && !isHttpUrl(shareInfo.cover)) {
    throw new Error('Invalid Xiaohongshu cover payload')
  }
}

function createSessionId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

function getAppPlatform() {
  const userAgent = navigator.userAgent || ''

  if (/android/i.test(userAgent))
    return 'Android'

  if (/iphone|ipad|ipod/i.test(userAgent))
    return 'iOS'

  return 'pc'
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return window.btoa(binary)
}

function buildUrl(url: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return `${url}?${searchParams.toString()}`
}

function isAndroidUserAgent() {
  return /android/i.test(navigator.userAgent || '')
}

export async function createXhsShareLinks(shareInfo: XhsShareInfo, verifyConfig: XhsShareVerifyConfig): Promise<XhsShareLinks> {
  validateShareInfo(shareInfo)

  const sessionId = createSessionId()
  const payload = {
    ...shareInfo,
    sessionId,
    pageUrl: window.location.href,
    appPlatform: getAppPlatform(),
    userAgent: navigator.userAgent || '',
    appKey: verifyConfig.appKey,
  }

  const response = await fetch(XHS_CHECK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_key: verifyConfig.appKey,
      nonce: verifyConfig.nonce,
      timestamp: verifyConfig.timestamp,
      signature: verifyConfig.signature,
      data: encodeBase64Utf8(JSON.stringify(payload)),
    }),
  })

  const result = await response.json() as XhsCheckTokenResponse
  const shareCode = result?.data?.data_code

  if (!response.ok || !result?.success || !shareCode) {
    throw new Error(result?.msg || 'Failed to create Xiaohongshu share link')
  }

  const urlSchema = buildUrl(XHS_URL_SCHEMA, {
    share_code: shareCode,
    app_key: verifyConfig.appKey,
    session_id: sessionId,
  })

  const universalLink = buildUrl(XHS_UNIVERSAL_LINK, {
    deeplink: urlSchema,
  })

  return {
    universalLink,
    urlSchema,
  }
}

export function openXhsShareLinks(shareLinks: XhsShareLinks) {
  if (isAndroidUserAgent()) {
    openDeepLink(shareLinks.urlSchema, {
      timeout: 6000,
    })
    return
  }

  window.location.href = shareLinks.universalLink
}

export async function launchXhsShare(
  shareInfo: XhsShareInfo,
  verifyConfig: XhsShareVerifyConfig,
) {
  const shareLinks = await createXhsShareLinks(shareInfo, verifyConfig)
  openXhsShareLinks(shareLinks)

  return shareLinks
}
