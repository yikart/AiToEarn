/*
 * @Description: 数据监控 API
 */
import http from '@/utils/request'

// 媒体类型
export interface MediaItem {
  type: 'img' | 'video'
  url: string
  live_photo?: number
  imageUrl?: string
}

// 图片列表项
export interface ImageListItem {
  live_photo: number
  imageUrl: string
}

// 帖子详情
export interface PostDetail {
  id: string
  postId: string
  platform: string
  title: string
  desc: string
  cover: string
  mediaType: 'image' | 'video'
  url: string
  publishTime: number
  readCount: number
  commentCount: number
  likeCount: number
  forwardCount: number
  collectCount: number
}

// 数据洞察
export interface Insight {
  _id: string
  uid: string
  userId: string
  accountId: string
  categoryId: string
  platform: string
  postId: string
  title: string
  desc: string
  cover: string
  mediaType: 'image' | 'video'
  url: string
  duration: string
  viewCount: number
  commentCount: number
  likeCount: number
  shareCount: number
  clickCount: number
  impressionCount: number
  favoriteCount: number
  publishTime: string
  tags: string[]
  videoUrl: string
  snapshotDate: string
  createdAt: string
  updatedAt: string
  imageList: ImageListItem[]
  medias: any[]
  downloadUrl: any[]
  snapshotDateAsDate: string
}

// 监控项目
export interface NoteMonitoringItem {
  _id: string
  platform: string
  userId: string
  link: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enabled: boolean
  createdAt: string
  updatedAt: string
  error?: string
  uploadMediaList: MediaItem[]
  postId: string
  uid: string
  postDetail: PostDetail
  insights: Insight[]
}

// 统计信息（用于列表展示）
export interface NoteMonitoringStats {
  id: string
  title: string
  platform: string
  stats: {
    viewCount: number
    likeCount: number
    commentCount: number
    favoriteCount: number
  }
  createdAt: string
}

export interface GetNoteMonitoringListParams {
  platform: string
  page?: number
  pageSize?: number
}

export interface AddNoteMonitoringParams {
  platform: string
  link: string
}

/**
 * 获取笔记监测列表
 */
export async function apiGetNoteMonitoringList(params: GetNoteMonitoringListParams) {
  const res = await http.post<NoteMonitoringItem[]>('statistics/posts/monitor/list', params)
  return res?.data || []
}

/**
 * 添加笔记监测
 */
export async function apiAddNoteMonitoring(params: AddNoteMonitoringParams) {
  const res = await http.post<NoteMonitoringItem>('statistics/posts/monitor/create', params)
  return res?.data
}

/**
 * 获取笔记监测详情
 */
export async function apiGetNoteMonitoringDetail(id: string) {
  const res = await http.get<NoteMonitoringItem>(`statistics/posts/monitor/${id}`)
  return res?.data
}

