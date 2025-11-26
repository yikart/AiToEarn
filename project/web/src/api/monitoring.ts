/*
 * @Description: 数据监控 API
 */
import http from '@/utils/request'

export interface NoteMonitoringItem {
  id: string
  userId: string
  type: 'link' | 'account' // 监测类型：链接或账号
  platform: string // 平台名称
  url?: string // 笔记链接
  accountId?: string // 账号ID
  noteId: string // 笔记ID
  title?: string // 笔记标题
  coverUrl?: string // 封面图
  stats: {
    viewCount: number // 阅读数
    likeCount: number // 点赞数
    commentCount: number // 评论数
    favoriteCount: number // 收藏数
    shareCount: number // 分享数
  }
  monitoringStatus: 'active' | 'paused' | 'stopped' // 监测状态
  monitoringFrequency: number // 监测频率（分钟）
  lastUpdateTime: string // 最后更新时间
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
}

export interface NoteMonitoringDetail extends NoteMonitoringItem {
  history: {
    time: string
    viewCount: number
    likeCount: number
    commentCount: number
    favoriteCount: number
    shareCount: number
  }[]
}

export interface GetNoteMonitoringListParams {
  type?: 'link' | 'account'
  page?: number
  pageSize?: number
}

export interface AddNoteMonitoringParams {
  type: 'link' | 'account'
  url?: string // 笔记链接
  accountId?: string // 账号ID
}

/**
 * 获取笔记监测列表
 */
export async function apiGetNoteMonitoringList(params: GetNoteMonitoringListParams) {
  const res = await http.get<{ data: NoteMonitoringItem[], total: number }>('/monitoring/note/list', {
    params,
  })
  return res?.data?.data || []
}

/**
 * 添加笔记监测
 */
export async function apiAddNoteMonitoring(params: AddNoteMonitoringParams) {
  const res = await http.post<{ data: NoteMonitoringItem }>('/monitoring/note/add', params)
  return res?.data?.data
}

/**
 * 获取笔记监测详情
 */
export async function apiGetNoteMonitoringDetail(id: string) {
  const res = await http.get<{ data: NoteMonitoringDetail }>(`/monitoring/note/detail/${id}`)
  return res?.data?.data
}

/**
 * 暂停/恢复笔记监测
 */
export async function apiToggleNoteMonitoring(id: string, status: 'active' | 'paused') {
  const res = await http.post<{ data: boolean }>(`/monitoring/note/toggle/${id}`, { status })
  return res?.data?.data
}

/**
 * 删除笔记监测
 */
export async function apiDeleteNoteMonitoring(id: string) {
  const res = await http.delete<{ data: boolean }>(`/monitoring/note/delete/${id}`)
  return res?.data?.data
}

/**
 * 导出监测数据
 */
export async function apiExportNoteMonitoringData(id: string) {
  const res = await http.get<Blob>(`/monitoring/note/export/${id}`, {
    responseType: 'blob',
  })
  return res?.data
}

