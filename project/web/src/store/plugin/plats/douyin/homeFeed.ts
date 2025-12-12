/**
 * 抖音首页列表功能模块
 *
 * 通过插件调用抖音 API 获取首页推荐作品列表
 */

import type { HomeFeedItem, HomeFeedListParams, HomeFeedListResult } from '../types'

/**
 * 深度过滤对象中的 null 值字段
 * @param obj 要过滤的对象
 * @returns 过滤后的对象
 */
function filterNullValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterNullValues(item)) as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null) {
        result[key] = filterNullValues(value)
      }
    }
    return result as T
  }

  return obj
}

/**
 * 抖音首页列表 API 基础 URL
 */
const DOUYIN_FEED_API = 'https://www.douyin.com/aweme/v2/web/module/feed/'

/**
 * 首页列表游标管理器
 * 抖音分页使用 refresh_index 自增方式
 */
class HomeFeedCursorManager {
  /**
   * 当前刷新索引
   */
  private refreshIndex = 1

  /**
   * 当前已请求的最大页码
   */
  private maxRequestedPage = 0

  /**
   * 重置游标缓存
   */
  reset(): void {
    this.refreshIndex = 1
    this.maxRequestedPage = 0
  }

  /**
   * 获取刷新索引
   */
  getRefreshIndex(page: number): number {
    // 第一页返回 1，后续页面返回累积的刷新索引
    if (page === 1) {
      return 1
    }
    return this.refreshIndex
  }

  /**
   * 更新刷新索引
   */
  updateRefreshIndex(currentPage: number): void {
    this.refreshIndex = currentPage + 1
    this.maxRequestedPage = currentPage
  }

  /**
   * 获取最大已请求页码
   */
  getMaxRequestedPage(): number {
    return this.maxRequestedPage
  }
}

/**
 * 游标管理器实例
 */
export const homeFeedCursor = new HomeFeedCursorManager()

/**
 * 构建抖音首页列表请求 URL
 * @param params 分页参数
 * @param refreshIndex 刷新索引
 */
function buildFeedRequestUrl(params: HomeFeedListParams, refreshIndex: number): string {
  const { size } = params

  // 基础查询参数
  const queryParams = new URLSearchParams({
    device_platform: 'webapp',
    aid: '6383',
    channel: 'channel_pc_web',
    module_id: '3003101',
    count: String(size),
    filterGids: '',
    presented_ids: '',
    refresh_index: String(refreshIndex),
    refer_id: '',
    refer_type: '10',
    pull_type: '0',
    awemePcRecRawData: JSON.stringify({
      is_xigua_user: 0,
      danmaku_switch_status: 0,
      is_client: false,
    }),
    'Seo-Flag': '0',
    tag_id: '300204',
    active_id: '',
    is_active_tab: 'false',
    use_lite_type: '1',
    xigua_user: '0',
    pc_client_type: '1',
    pc_libra_divert: 'Windows',
    update_version_code: '170400',
    support_h265: '1',
    support_dash: '1',
    version_code: '170400',
    version_name: '17.4.0',
    cookie_enabled: 'true',
    screen_width: '1920',
    screen_height: '1080',
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Chrome',
    browser_version: '120.0.0.0',
    browser_online: 'true',
    engine_name: 'Blink',
    engine_version: '120.0.0.0',
    os_name: 'Windows',
    os_version: '10',
    cpu_core_num: '8',
    device_memory: '8',
    platform: 'PC',
    downlink: '10',
    effective_type: '4g',
    round_trip_time: '50',
  })

  return `${DOUYIN_FEED_API}?${queryParams.toString()}`
}

/**
 * 将抖音原始数据转换为统一格式
 * @param item 抖音原始作品数据（any 类型，字段太多不写类型）
 */
export function transformToHomeFeedItem(item: any): HomeFeedItem {
  // 提取作者信息
  const author = item.author || {}
  const authorAvatarList = author.avatar_thumb?.url_list || author.avatar_medium?.url_list || []

  // 提取视频信息
  const video = item.video || {}
  const coverList = video.cover?.url_list || video.origin_cover?.url_list || []

  // 提取统计信息
  const statistics = item.statistics || {}

  // 格式化点赞数（转换大数字为"万"）
  const formatLikeCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`
    }
    return String(count || 0)
  }

  // 提取封面尺寸
  const cover = video.cover || {}

  return {
    workId: item.aweme_id || '',
    thumbnail: coverList[0] || '',
    thumbnailWidth: cover.width,
    thumbnailHeight: cover.height,
    title: item.desc || item.preview_title || '',
    authorAvatar: authorAvatarList[0] || '',
    authorName: author.nickname || '',
    authorId: author.uid || author.sec_uid || '',
    likeCount: formatLikeCount(statistics.digg_count || 0),
    isVideo: true, // 抖音主要是视频
    videoDuration: video.duration ? Math.floor(video.duration / 1000) : undefined,
    origin: filterNullValues(item),
  }
}

/**
 * 获取首页作品列表
 * 通过插件调用抖音 API
 * @param params 分页参数
 */
export async function getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
  // 检查插件是否可用
  if (!window.AIToEarnPlugin) {
    return {
      success: false,
      message: '插件未安装或未就绪',
      items: [],
      hasMore: false,
    }
  }

  const { page, size } = params

  // 页码从1开始
  if (page < 1) {
    return {
      success: false,
      message: '页码必须大于0',
      items: [],
      hasMore: false,
    }
  }

  // 检查跳页情况
  const maxPage = homeFeedCursor.getMaxRequestedPage()
  if (page > maxPage + 1) {
    return {
      success: false,
      message: `不支持跳页，请先请求第 ${maxPage + 1} 页`,
      items: [],
      hasMore: false,
    }
  }

  // 如果是第1页，重置游标
  if (page === 1) {
    homeFeedCursor.reset()
  }

  // 获取当前页的刷新索引
  const refreshIndex = homeFeedCursor.getRefreshIndex(page)

  // 构建请求 URL
  const requestUrl = buildFeedRequestUrl(params, refreshIndex)

  try {
    // 调用插件的抖音请求接口
    const response = await window.AIToEarnPlugin.douyinRequest<any>({
      path: requestUrl,
      method: 'POST',
    })

    // 检查响应状态
    if (response.status_code !== 0) {
      return {
        success: false,
        message: response.status_msg || '获取首页列表失败',
        items: [],
        hasMore: false,
        rawData: response,
      }
    }

    // 获取作品列表
    const awemeList = response.aweme_list || []

    // 转换数据格式
    const items: HomeFeedItem[] = awemeList
      .filter((item: any) => item.aweme_id) // 过滤无效数据
      .map((item: any) => transformToHomeFeedItem(item))

    // 更新游标
    homeFeedCursor.updateRefreshIndex(page)

    // 判断是否有更多数据
    const hasMore = response.has_more === 1 && items.length >= size

    return {
      success: true,
      items,
      hasMore,
      rawData: response,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '请求失败',
      items: [],
      hasMore: false,
    }
  }
}
