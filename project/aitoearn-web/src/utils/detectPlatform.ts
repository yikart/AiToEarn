/**
 * detectPlatform - URL 自动识别平台工具
 * 从作品链接中检测社交平台类型
 */

import { PlatType } from '@/app/config/platConfig'

/** hostname 后缀 → PlatType 映射 */
const PLATFORM_HOST_MAP: [string, PlatType][] = [
  ['xiaohongshu.com', PlatType.Xhs],
  ['xhslink.com', PlatType.Xhs],
  ['tiktok.com', PlatType.Tiktok],
  ['youtube.com', PlatType.YouTube],
  ['youtu.be', PlatType.YouTube],
  ['x.com', PlatType.Twitter],
  ['twitter.com', PlatType.Twitter],
  ['facebook.com', PlatType.Facebook],
  ['fb.com', PlatType.Facebook],
  ['fb.watch', PlatType.Facebook],
  ['instagram.com', PlatType.Instagram],
  ['instagr.am', PlatType.Instagram],
  ['bilibili.com', PlatType.BILIBILI],
  ['b23.tv', PlatType.BILIBILI],
  ['douyin.com', PlatType.Douyin],
  ['iesdouyin.com', PlatType.Douyin],
]

/**
 * 从 URL 中检测社交平台类型
 * @param url 作品链接
 * @returns 匹配到的 PlatType，未匹配返回 null
 */
export function detectPlatformFromUrl(url: string): PlatType | null {
  const trimmed = url.trim()
  if (!trimmed)
    return null

  try {
    const fullUrl = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    const { hostname } = new URL(fullUrl)

    for (const [domain, platType] of PLATFORM_HOST_MAP) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return platType
      }
    }
  }
  catch {
    return null
  }

  return null
}
