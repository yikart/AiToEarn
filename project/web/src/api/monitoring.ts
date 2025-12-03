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
  author?: string
  avatar?: string
}

// 增量数据
export interface DeltaData {
  followerCountIncrease: number
  followingCountIncrease: number
  viewCountIncrease: number
  likeCountIncrease: number
  commentCountIncrease: number
  favoriteCountIncrease: number
  shareCountIncrease: number
}

// 数据洞察
export interface Insight {
  _id: string
  platform: string
  businessDate: string
  postId: string
  uid: string
  createdAt: string
  updatedAt: string
  dailyDelta: DeltaData
  weeklyDelta: DeltaData
  monthlyDelta: DeltaData
}

// 监控列表项（简单信息）
export interface NoteMonitoringListItem {
  _id: string
  platform: string
  userId: string
  link: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enabled: boolean
  createdAt: string
  updatedAt: string
  error?: string
  postDetail?: PostDetail
}

// 监控详情（包含完整信息）
export interface NoteMonitoringItem extends NoteMonitoringListItem {
  uploadMediaList?: MediaItem[]
  postId?: string
  uid?: string
  postDetail?: PostDetail
  insights?: Insight[]
}

// 列表返回数据
export interface NoteMonitoringListResponse {
  items: NoteMonitoringListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface GetNoteMonitoringListParams {
  platform?: string
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
  const res = await http.post<NoteMonitoringListResponse>('statistics/posts/monitor/list', params)
  return res?.data || { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 }
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
  const res = await http.post<NoteMonitoringItem>(`statistics/posts/monitor/${id}`)
  return res?.data
}

/**
 * 暂停/恢复笔记监测（暂未实现）
 */
export async function apiToggleNoteMonitoring(id: string, enabled: boolean) {
  const res = await http.post<boolean>(`statistics/posts/monitor/${id}/toggle`, { enabled })
  return res?.data
}

/**
 * 删除笔记监测（暂未实现）
 */
export async function apiDeleteNoteMonitoring(id: string) {
  const res = await http.delete<boolean>(`statistics/posts/monitor/${id}`)
  return res?.data
}

/**
 * 导出监测数据（暂未实现）
 */
export async function apiExportNoteMonitoringData(id: string) {
  const res = await http.get<Blob>(`statistics/posts/monitor/${id}/export`, {
    responseType: 'blob',
  } as any)
  return res?.data
}

