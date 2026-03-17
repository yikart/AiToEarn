import type { DraftMaterial } from '@/app/[lng]/draft-box/types'
import type { PubType } from '@/app/config/publishConfig'
import http from '@/utils/request'

export type MaterialMediaType = 'img' | 'video'

export interface MaterialMedia {
  url: string
  type: MaterialMediaType
  content?: string
}

export interface NewMaterialTask {
  groupId: string
  num: number
  aiModelTag: string
  type: MaterialMediaType
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
export function apiCreateMaterialGroup(data: { name: string }) {
  return http.post<{ _id: string }>('material/group', {
    ...data,
    type: 'video',
  })
}

// 删除草稿素材组
export function apiDeleteMaterialGroup(id: string) {
  return http.delete(`material/group/${id}`)
}

// 更新草稿素材组信息
export function apiUpdateMaterialGroupInfo(
  id: string,
  data: {
    name?: string
  },
) {
  return http.post(`material/group/info/${id}`, data)
}

// 获取草稿素材组列表
export function apiGetMaterialGroupList(pageNo: number, pageSize: number) {
  return http.get<{ list: any[], total: number }>(`material/group/list/${pageNo}/${pageSize}`)
}

// 获取草稿素材组详情
export function apiGetMaterialGroupInfo(id: string) {
  return http.get(`material/group/${id}`)
}

// 获取素材详情
export function apiGetMaterialInfo(id: string) {
  return http.get(`material/group/info/${id}`)
}

// 创建草稿素材
export function apiCreateMaterial(
  data: {
    groupId: string
    coverUrl?: string
    mediaList: MaterialMedia[]
    title: string
    desc?: string
    type: PubType
    option?: Record<string, any>
    location?: number[]
  },
  silent?: boolean,
) {
  return http.post('material', data, silent)
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

export interface MaterialListFilters {
  title?: string
  useCount?: number
}

export interface MaterialFilterDeleteParams {
  title?: string
  groupId?: string
  useCount?: number
}

// 批量删除草稿素材
export function apiBatchDeleteMaterials(ids: string[]) {
  return http.delete('material/list', { ids })
}

// 按条件删除草稿素材
export function apiFilterDeleteMaterials(data: MaterialFilterDeleteParams) {
  return http.delete('material/filter', data)
}

// 获取草稿素材列表
export async function apiGetMaterialList(groupId: string, pageNo: number, pageSize: number, filters?: MaterialListFilters) {
  const params: Record<string, any> = { groupId }
  if (filters?.title)
    params.title = filters.title
  if (filters?.useCount !== undefined)
    params.useCount = filters.useCount
  const res = await http.get<{ list: DraftMaterial[], total: number }>(`material/list/${pageNo}/${pageSize}`, params)
  const list = res?.data?.list
  // 兼容代码，图文草稿补封面
  if (list && list.length > 0) {
    list.map((item) => {
      if (item.mediaList[0].type === 'img') {
        item.coverUrl = item.mediaList[0].url
      }
    })
  }
  return res
}

// 更新草稿素材信息
export function apiUpdateMaterialInfo(
  id: string,
  data: {
    title?: string
    desc?: string
  },
) {
  return http.put(`material/info/${id}`, data)
}

// 更新草稿素材完整信息
export function apiUpdateMaterial(
  id: string,
  data: {
    coverUrl?: string
    mediaList?: MaterialMedia[]
    title?: string
    desc?: string
    location?: number[]
    option?: Record<string, any>
  },
) {
  return http.put(`material/info/${id}`, data)
}
