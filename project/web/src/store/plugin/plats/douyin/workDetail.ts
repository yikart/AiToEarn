/**
 * 抖音作品详情功能模块
 * 
 * 抖音不需要额外请求详情API，直接从list的item数据获取详情
 */

import type { GetWorkDetailParams, GetWorkDetailResult, TopicInfo, WorkDetail } from '../types'

/**
 * 构建抖音作者主页链接
 * @param secUid 作者的 sec_uid
 */
function buildAuthorUrl(secUid: string): string {
  const params = new URLSearchParams({
    from_tab_name: 'main',
  })
  return `https://www.douyin.com/user/${secUid}?${params.toString()}`
}

/**
 * 构建抖音话题搜索链接
 * @param keyword 话题关键词
 */
function buildTopicUrl(keyword: string): string {
  return `https://www.douyin.com/jingxuan/search/${encodeURIComponent(keyword)}?type=general`
}

/**
 * 从描述中提取话题标签
 * @param desc 作品描述
 * @returns 话题名称数组
 */
function extractTopicsFromDesc(desc: string): string[] {
  if (!desc) return []
  // 匹配 #话题 格式的标签（中文、英文、数字）
  const regex = /#([^\s#]+)/g
  const topics: string[] = []
  let match
  while ((match = regex.exec(desc)) !== null) {
    topics.push(match[1])
  }
  return topics
}

/**
 * 格式化数字（转换大数字为"万"）
 */
function formatCount(count: number | undefined): string {
  if (!count) return '0'
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return String(count)
}

/**
 * 将抖音原始数据转换为作品详情
 * @param item 抖音原始作品数据（来自list的origin字段）
 */
export function transformToWorkDetail(item: any): WorkDetail {
  // 提取作者信息
  const author = item.author || {}
  const authorAvatarList = author.avatar_thumb?.url_list || author.avatar_medium?.url_list || []
  const authorSecUid = author.sec_uid || ''

  // 提取视频信息
  const videoData = item.video || {}
  const coverList = videoData.cover?.url_list || videoData.origin_cover?.url_list || []

  // 提取统计信息
  const statistics = item.statistics || {}

  // 解析话题列表
  const topicNames: string[] = []
  
  if (item.cha_list && Array.isArray(item.cha_list)) {
    item.cha_list.forEach((cha: any) => {
      if (cha.cha_name) {
        topicNames.push(cha.cha_name)
      }
    })
  }
  
  if (topicNames.length === 0 && item.text_extra && Array.isArray(item.text_extra)) {
    item.text_extra.forEach((extra: any) => {
      if (extra.hashtag_name) {
        topicNames.push(extra.hashtag_name)
      }
    })
  }
  
  if (topicNames.length === 0) {
    // 从描述中解析话题
    topicNames.push(...extractTopicsFromDesc(item.desc || ''))
  }

  // 去重并构建话题对象
  const uniqueTopics = [...new Set(topicNames)]
  const topics: TopicInfo[] = uniqueTopics.map(name => ({
    name,
    url: buildTopicUrl(name),
  }))

  // 构建作者主页链接
  const authorUrl = buildAuthorUrl(authorSecUid)

  // 构建图片列表（抖音主要是视频，这里用封面）
  const imageList = coverList.length > 0 ? [{
    url: coverList[0],
    width: videoData.width,
    height: videoData.height,
  }] : []

  // 构建视频信息
  const video: WorkDetail['video'] = {
    url: videoData.play_addr?.url_list?.[0] || '',
    duration: videoData.duration ? Math.floor(videoData.duration / 1000) : undefined,
    width: videoData.width,
    height: videoData.height,
  }

  return {
    workId: item.aweme_id || '',
    type: 'video', // 抖音主要是视频
    title: item.desc || item.preview_title || '',
    description: item.desc || '',
    coverUrl: coverList[0] || '',
    imageList,
    video,
    author: {
      id: author.uid || authorSecUid || '',
      name: author.nickname || '',
      avatar: authorAvatarList[0] || '',
      url: authorUrl,
    },
    interactInfo: {
      likeCount: formatCount(statistics.digg_count),
      collectCount: formatCount(statistics.collect_count),
      commentCount: formatCount(statistics.comment_count),
      shareCount: formatCount(statistics.share_count),
      isLiked: item.user_digged === 1,
      isCollected: item.collect_stat === 1,
      isFollowed: author.follow_status === 1,
    },
    topics,
    publishTime: item.create_time ? item.create_time * 1000 : undefined,
    origin: item,
  }
}

/**
 * 获取抖音作品详情
 * 抖音直接从list的item数据获取详情，不需要额外请求API
 * @param params 详情请求参数（需要包含 origin 字段，来自 HomeFeedItem.origin）
 */
export async function getWorkDetail(params: GetWorkDetailParams): Promise<GetWorkDetailResult> {
  const { workId, origin } = params

  if (!workId) {
    return {
      success: false,
      message: '作品ID不能为空',
    }
  }

  // 如果传入了 origin 数据，直接使用
  if (origin) {
    return getWorkDetailFromListItem(origin)
  }

  // 没有传入 origin 数据，返回错误提示
  return {
    success: false,
    message: '抖音详情需要从列表数据获取，请在参数中传入 origin 字段（来自 HomeFeedItem.origin）',
  }
}

/**
 * 从列表项获取作品详情
 * @param listItemOrigin HomeFeedItem.origin 原始数据
 */
export function getWorkDetailFromListItem(listItemOrigin: any): GetWorkDetailResult {
  if (!listItemOrigin) {
    return {
      success: false,
      message: '列表项数据不能为空',
    }
  }

  if (!listItemOrigin.aweme_id) {
    return {
      success: false,
      message: '无效的列表项数据',
    }
  }

  try {
    const detail = transformToWorkDetail(listItemOrigin)
    return {
      success: true,
      detail,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '转换详情数据失败',
    }
  }
}

