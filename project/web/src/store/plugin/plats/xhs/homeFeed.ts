/**
 * 小红书首页列表功能模块
 */

import type { HomeFeedItem, HomeFeedListParams, HomeFeedListResult } from '../types'
import type { XhsHomeFeedItem, XhsHomeFeedResponse } from './types'

/**
 * 首页列表游标管理器
 */
class HomeFeedCursorManager {
  /**
   * 游标缓存，用于分页转换
   * key: 页码, value: cursor_score
   */
  private cursorMap = new Map<number, string>()

  /**
   * 当前已请求的最大页码
   */
  private maxRequestedPage = 0

  /**
   * 重置游标缓存
   */
  reset(): void {
    this.cursorMap.clear()
    this.maxRequestedPage = 0
  }

  /**
   * 获取当前页的游标
   */
  getCursor(page: number): string {
    return page === 1 ? '' : (this.cursorMap.get(page) || '')
  }

  /**
   * 存储下一页的游标
   */
  setCursor(currentPage: number, cursorScore: string): void {
    this.cursorMap.set(currentPage + 1, cursorScore)
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
 * 构建首页列表请求数据
 */
export function buildHomeFeedRequestData(params: HomeFeedListParams, cursorScore: string): object {
  const { page, size } = params

  return {
    cursor_score: cursorScore,
    num: size,
    refresh_type: page === 1 ? 1 : 3,
    note_index: (page - 1) * size,
    unread_begin_note_id: '',
    unread_end_note_id: '',
    unread_note_count: 0,
    category: 'homefeed_recommend',
    search_key: '',
    need_num: Math.min(size, 10),
    image_formats: ['jpg', 'webp', 'avif'],
    need_filter_image: false,
  }
}

/**
 * 构建小红书作者主页链接
 * @param userId 用户ID
 * @param xsecToken 用户的 xsec_token
 */
function buildAuthorUrl(userId: string, xsecToken: string): string {
  const params = new URLSearchParams({
    xsec_token: xsecToken,
    xsec_source: 'pc_feed',
  })
  return `https://www.xiaohongshu.com/user/profile/${userId}?${params.toString()}`
}

/**
 * 构建小红书话题搜索链接
 * @param keyword 话题关键词
 */
function buildTopicUrl(keyword: string): string {
  const params = new URLSearchParams({
    keyword,
    type: '54',
    source: 'web_note_detail_r10',
  })
  return `https://www.xiaohongshu.com/search_result/?${params.toString()}`
}

/**
 * 将小红书原始数据转换为统一格式
 */
export function transformToHomeFeedItem(item: XhsHomeFeedItem): HomeFeedItem {
  const { note_card } = item

  // 构建作者主页链接
  const authorUrl = buildAuthorUrl(
    note_card.user?.user_id || '',
    note_card.user?.xsec_token || ''
  )

  // 解析话题列表
  const topics = (note_card.tag_list || []).map(tag => ({
    name: tag.name,
    url: buildTopicUrl(tag.name),
  }))

  return {
    workId: item.id,
    thumbnail: note_card.cover?.url_default || note_card.cover?.url_pre || '',
    title: note_card.display_title || '',
    authorAvatar: note_card.user?.avatar || '',
    authorName: note_card.user?.nickname || note_card.user?.nick_name || '',
    authorId: note_card.user?.user_id || '',
    authorUrl,
    likeCount: note_card.interact_info?.liked_count || '0',
    isFollowed: note_card.interact_info?.followed ?? false,
    isLiked: note_card.interact_info?.liked ?? false,
    isCollected: note_card.interact_info?.collected ?? false,
    isVideo: note_card.type === 'video',
    videoDuration: note_card.video?.capa?.duration,
    topics,
    origin: item,
    thumbnailWidth: note_card.cover.width,
    thumbnailHeight: note_card.cover.height,
  }
}

/**
 * 获取首页作品列表
 * 使用游标分页转换为 page/size 分页
 */
export async function getHomeFeedList(params: HomeFeedListParams): Promise<HomeFeedListResult> {
  // 检查插件
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

  // 如果请求的页码超过已请求的最大页码+1，需要顺序请求
  // 游标分页只能顺序获取，不支持跳页
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

  // 获取当前页的游标
  const cursorScore = homeFeedCursor.getCursor(page)

  // 构建请求数据
  const requestData = buildHomeFeedRequestData(params, cursorScore)

  try {
    const response = await window.AIToEarnPlugin.xhsRequest<XhsHomeFeedResponse>({
      path: '/api/sns/web/v1/homefeed',
      method: 'POST',
      data: requestData,
    })

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.msg || '获取首页列表失败',
        items: [],
        hasMore: false,
        rawData: response,
      }
    }

    // 存储下一页的游标
    if (response.data.cursor_score) {
      homeFeedCursor.setCursor(page, response.data.cursor_score)
    }

    // 转换数据格式
    const items: HomeFeedItem[] = response.data.items
      .filter(item => item.model_type === 'note' && item.note_card)
      .map(item => transformToHomeFeedItem(item))

    return {
      success: true,
      items,
      hasMore: items.length >= size && !!response.data.cursor_score,
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

