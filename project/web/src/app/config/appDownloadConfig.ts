/**
 * 应用下载配置文件
 * 管理不同平台的下载链接、二维码等信息
 */

// 根据语言获取主应用下载地址
// zh-* 使用中文地址，其余使用英文地址
// 优先使用API返回的direct下载地址，如果获取失败则使用默认地址
import { useUserStore } from '@/store/user'

export interface AppDownloadConfig {
  platform: string
  appName: string
  downloadUrl: string
  qrCodeUrl?: string
  description: string
  tips: string[]
}

// API响应类型定义
interface AppReleaseResponse {
  data: {
    _id: string
    platform: string
    version: string
    buildNumber: number
    forceUpdate: boolean
    notes: string
    links: {
      direct?: string
      _id: string
      id: string
    }
    publishedAt: string
    id: string
  }
  code: number
  message: string
}

// 主应用下载配置（默认英文）
export const MAIN_APP_DOWNLOAD_URL = 'https://docs.aitoearn.ai/en/downloads'

// API端点
const APP_RELEASE_API = 'https://aitoearn.ai/api/app-release/latest'

// 缓存最新下载地址
let cachedDownloadUrl: string | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
let inflightRequest: Promise<string | null> | null = null

/**
 * 从API获取最新的Android应用下载地址
 * @returns 最新的下载地址，如果获取失败则返回null
 */
export async function fetchLatestDownloadUrl(): Promise<string | null> {
  try {
    // 检查缓存
    const now = Date.now()
    if (cachedDownloadUrl && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedDownloadUrl
    }

    // 如果存在进行中的请求，直接复用
    if (inflightRequest) {
      return inflightRequest
    }

    inflightRequest = (async () => {
      const response = await fetch(`${APP_RELEASE_API}?platform=android`)

      if (!response.ok) {
        console.error('Failed to fetch app release info:', response.statusText)
        return null
      }

      const result: AppReleaseResponse = await response.json()

      if (result.code === 0 && result.data?.links?.direct) {
        // 缓存下载地址
        cachedDownloadUrl = result.data.links.direct
        lastFetchTime = now
        return cachedDownloadUrl
      }

      return null
    })()

    const data = await inflightRequest
    inflightRequest = null
    return data
  }
  catch (error) {
    console.error('Error fetching latest download url:', error)
    inflightRequest = null
    return null
  }
}
export async function getMainAppDownloadUrl(lng?: string): Promise<string> {
  // 尝试从API获取最新下载地址
  const latestUrl = await fetchLatestDownloadUrl()
  if (latestUrl) {
    return latestUrl
  }

  // 如果API获取失败，使用默认地址
  const lang = (lng || useUserStore.getState().lang || 'zh-CN').toLowerCase()
  const isZh = lang.startsWith('zh')
  return isZh
    ? 'https://docs.aitoearn.ai/zh/downloads'
    : 'https://docs.aitoearn.ai/en/downloads'
}

/**
 * 同步获取主应用下载地址（用于不支持async的场景）
 * 会先返回缓存的URL，如果没有缓存则返回默认URL
 * 同时在后台触发API请求更新缓存
 */
export function getMainAppDownloadUrlSync(lng?: string): string {
  // 后台更新缓存
  fetchLatestDownloadUrl().catch(console.error)

  // 如果有缓存，返回缓存的URL
  if (cachedDownloadUrl) {
    return cachedDownloadUrl
  }

  // 否则返回默认URL
  const lang = (lng || useUserStore.getState().lang || 'zh-CN').toLowerCase()
  const isZh = lang.startsWith('zh')
  return isZh
    ? 'https://docs.aitoearn.ai/zh/downloads'
    : 'https://docs.aitoearn.ai/en/downloads'
}

export const APP_DOWNLOAD_CONFIGS: Record<string, AppDownloadConfig> = {
  xhs: {
    platform: 'Xiaohongshu',
    appName: 'Xiaohongshu App',
    downloadUrl: 'https://apps.apple.com/cn/app/id123456789', // Configure actual download link here
    qrCodeUrl: '', // Configure actual QR code image URL here
    description: 'Xiaohongshu operations need to be performed in the mobile app. Please download and install the Xiaohongshu App to continue.',
    tips: [
      'After installation, please log in to your account in the App',
      'Ensure your account has completed identity verification',
      'Complete related task operations in the App',
    ],
  },
  douyin: {
    platform: 'Douyin',
    appName: 'Douyin App',
    downloadUrl: 'https://apps.apple.com/cn/app/douyin/id123456789',
    qrCodeUrl: '',
    description: 'Douyin operations need to be performed in the mobile app. Please download and install the Douyin App to continue.',
    tips: [
      'After installation, please log in to your account in the App',
      'Ensure your account has completed identity verification',
      'Complete related task operations in the App',
    ],
  },
  // Additional platform configurations can be added here
}

/**
 * 获取平台下载配置
 * @param platformKey 平台标识符，如 'xhs', 'douyin'
 * @returns 下载配置信息
 */
export function getAppDownloadConfig(platformKey: string): AppDownloadConfig | null {
  return APP_DOWNLOAD_CONFIGS[platformKey] || null
}

/**
 * 检查任务是否需要App操作
 * @param accountTypes 账号类型数组
 * @returns 需要App操作的平台列表
 */
export function getTasksRequiringApp(accountTypes: string[]): string[] {
  return accountTypes.filter(type => APP_DOWNLOAD_CONFIGS[type])
}
