/**
 * 小红书作品详情功能模块
 */

import type { GetWorkDetailParams, GetWorkDetailResult, TopicInfo, WorkDetail } from '../types'

/**
 * 小红书详情 API 响应类型
 */
interface XhsDetailResponse {
  code: number
  success: boolean
  msg?: string
  data?: {
    items: XhsDetailItem[]
    cursor_score?: string
    current_time?: number
  }
}

/**
 * 小红书详情项类型
 */
interface XhsDetailItem {
  id: string
  model_type: string
  note_card: {
    note_id: string
    type: 'video' | 'normal'
    title: string
    desc: string
    interact_info: {
      liked: boolean
      liked_count: string
      collected: boolean
      collected_count: string
      comment_count: string
      share_count: string
      followed: boolean
      relation?: string
    }
    image_list: Array<{
      width: number
      height: number
      url: string
      url_pre: string
      url_default: string
      info_list?: Array<{
        image_scene: string
        url: string
      }>
      stream?: {
        h264?: Array<{
          master_url: string
          backup_urls?: string[]
        }>
        h265?: Array<{
          master_url: string
          backup_urls?: string[]
        }>
      }
      live_photo?: boolean
    }>
    user: {
      user_id: string
      nickname: string
      avatar: string
      xsec_token?: string
    }
    tag_list?: Array<{
      id: string
      name: string
      type: string
    }>
    time?: number
    ip_location?: string
    last_update_time?: number
    at_user_list?: Array<{
      user_id: string
      nickname: string
    }>
    video?: {
      capa?: {
        duration: number
      }
      consumer?: {
        origin_video_key?: string
      }
      media?: {
        stream?: {
          h264?: Array<{
            master_url: string
          }>
        }
      }
    }
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
 * 将小红书详情数据转换为统一格式
 */
function transformToWorkDetail(item: XhsDetailItem): WorkDetail {
  const { note_card } = item

  // 构建作者主页链接
  const authorUrl = buildAuthorUrl(
    note_card.user?.user_id || '',
    note_card.user?.xsec_token || '',
  )

  // 解析话题列表
  const topics: TopicInfo[] = (note_card.tag_list || [])
    .filter(tag => tag.type === 'topic')
    .map(tag => ({
      name: tag.name,
      url: buildTopicUrl(tag.name),
    }))

  // 解析图片列表
  const imageList = (note_card.image_list || []).map(img => ({
    url: img.url_default || img.url_pre || img.url || '',
    width: img.width,
    height: img.height,
  }))

  // 解析视频信息
  let video: WorkDetail['video'] | undefined
  if (note_card.type === 'video') {
    // 尝试从 image_list 的 stream 中获取视频URL
    const firstImage = note_card.image_list?.[0]
    const h264Stream = firstImage?.stream?.h264?.[0] || firstImage?.stream?.h265?.[0]
    const videoUrl = h264Stream?.master_url || ''

    video = {
      url: videoUrl,
      duration: note_card.video?.capa?.duration,
      width: firstImage?.width,
      height: firstImage?.height,
    }
  }

  return {
    workId: item.id,
    type: note_card.type || 'normal',
    title: note_card.title || '',
    description: note_card.desc || '',
    coverUrl: note_card.image_list?.[0]?.url_default || note_card.image_list?.[0]?.url_pre || '',
    imageList,
    video,
    author: {
      id: note_card.user?.user_id || '',
      name: note_card.user?.nickname || '',
      avatar: note_card.user?.avatar || '',
      url: authorUrl,
    },
    interactInfo: {
      likeCount: note_card.interact_info?.liked_count || '0',
      collectCount: note_card.interact_info?.collected_count || '0',
      commentCount: note_card.interact_info?.comment_count || '0',
      shareCount: note_card.interact_info?.share_count || '0',
      isLiked: note_card.interact_info?.liked ?? false,
      isCollected: note_card.interact_info?.collected ?? false,
      isFollowed: note_card.interact_info?.followed ?? false,
    },
    topics,
    publishTime: note_card.time,
    ipLocation: note_card.ip_location,
    origin: item,
  }
}

/**
 * 获取小红书作品详情
 * @param params 详情请求参数
 */
export async function getWorkDetail(params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
  // 检查插件
  if (!window.AIToEarnPlugin) {
    return {
      success: false,
      message: '插件未安装或未就绪',
    }
  }

  const { workId, xsecToken, xsecSource = 'pc_feed' } = params

  if (!workId) {
    return {
      success: false,
      message: '作品ID不能为空',
    }
  }

  // 构建请求数据
  const requestData = {
    source_note_id: workId,
    image_formats: ['jpg', 'webp', 'avif'],
    extra: {
      need_body_topic: '1',
    },
    xsec_source: xsecSource,
    xsec_token: xsecToken || '',
  }

  try {
    const response = await window.AIToEarnPlugin.xhsRequest<XhsDetailResponse>({
      path: '/api/sns/web/v1/feed',
      method: 'POST',
      data: requestData,
    })

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.msg || '获取作品详情失败',
        rawData: response,
      }
    }

    // 获取详情数据
    const items = response.data.items || []
    if (items.length === 0) {
      return {
        success: false,
        message: '作品不存在或已被删除',
        rawData: response,
      }
    }

    // 找到对应的作品
    const detailItem = items.find(item => item.id === workId || item.note_card?.note_id === workId)
    if (!detailItem) {
      return {
        success: false,
        message: '未找到对应作品',
        rawData: response,
      }
    }

    // 转换数据格式
    const detail = transformToWorkDetail(detailItem)

    return {
      success: true,
      detail,
      rawData: response,
    }
  }
  catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '请求失败',
    }
  }
}
