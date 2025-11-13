import type { PubType } from '@/app/config/publishConfig'
import http from '@/utils/request'

export interface MaterialMedia {
  url: string
  type: PubType
  content?: string
}

export enum MaterialType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

export interface NewMaterialTask {
  groupId: string
  num: number
  aiModelTag: string
  type: MaterialType
  prompt: string
  title?: string
  desc?: string
  location?: number[]
  publishTime?: string
  mediaGroups: string[]
  coverGroup: string
  option?: Record<string, any>
  textMax?: number
  language?: string
}

// 创建素材草稿组
export function apiCreateMaterialGroup(data: {
  type: PubType
  name: string
  desc?: string
}) {
  return http.post('material/group', data)
}

// 删除草稿素材组
export function apiDeleteMaterialGroup(id: string) {
  return http.delete(`material/group/${id}`)
}

// 更新草稿素材组信息
export function apiUpdateMaterialGroupInfo(id: string, data: {
  name?: string
  desc?: string
}) {
  return http.post(`material/group/info/${id}`, data)
}

// 获取草稿素材组列表
export function apiGetMaterialGroupList(pageNo: number, pageSize: number) {
  return http.get<{ list: any[], total: number }>(
    `material/group/list/${pageNo}/${pageSize}`,
  )
}

// 创建草稿素材
export function apiCreateMaterial(data: {
  groupId: string
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc?: string
  option?: Record<string, any>
  location?: number[]
}) {
  return http.post('material', data)
}

// 创建批量生成草稿任务
export function apiCreateMaterialTask(data: NewMaterialTask) {
  return http.post<{ _id: string }>('material/task/create', data)
}

// 预览生成草稿任务
export function apiPreviewMaterialTask(taskId: string) {
  return http.get(`material/task/preview/${taskId}`)
}

// 开始批量生成草稿任务
export function apiStartMaterialTask(taskId: string) {
  return http.get(`material/task/start/${taskId}`)
}

// 删除草稿素材
export function apiDeleteMaterial(id: string) {
  return http.delete(`material/${id}`)
}

// 获取草稿素材列表
export function apiGetMaterialList(groupId: string, pageNo: number, pageSize: number) {
  return http.get(`material/list/${pageNo}/${pageSize}`, {
    groupId,
  })
}

// 更新草稿素材信息
export function apiUpdateMaterialInfo(id: string, data: {
  title?: string
  desc?: string
}) {
  return http.put(`material/info/${id}`, data)
}

// 更新草稿素材完整信息
export function apiUpdateMaterial(id: string, data: {
  coverUrl?: string
  mediaList?: MaterialMedia[]
  title?: string
  desc?: string
  location?: number[]
  option?: Record<string, any>
}) {
  return http.put(`material/info/${id}`, data)
}
