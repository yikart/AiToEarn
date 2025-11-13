import http from '@/utils/request'

// 创建媒体资源组
export function createMediaGroup(data: {
  title: string
  desc: string
  type: 'video' | 'img'
}) {
  return http.post('media/group', data)
}

// 删除媒体资源组
export function deleteMediaGroup(id: string) {
  return http.delete(`media/group/${id}`)
}

// 获取媒体资源组列表
export function getMediaGroupList(pageNo: number, pageSize: number, type?: 'video' | 'img') {
  return http.get<{ list: any[], total: number }>(
    `media/group/list/${pageNo}/${pageSize}`,
    {
      type,
    },
  )
}

// 更新媒体资源组信息
export function updateMediaGroupInfo(id: string, data: {
  title?: string
  desc?: string
  type?: 'video' | 'img'
}) {
  return http.post(`media/group/info/${id}`, data)
}

// 创建媒体资源
export function createMedia(data: any) {
  return http.post('media', data)
}

// 删除媒体资源
export function deleteMedia(id: string) {
  return http.delete(`media/${id}`)
}

// 获取媒体资源列表
export function getMediaList(groupId: string, pageNo: number, pageSize: number) {
  return http.get(`media/list/${pageNo}/${pageSize}`, {
    groupId,
  })
}

// 更新媒体资源信息
export function updateMediaInfo(id: string, data: {
  title?: string
  desc?: string
}) {
  return http.put(`media/info/${id}`, data)
}

export function apiAddUseCount(id: string) {
  return http.put(`media/addUseCount`, { data: { id } })
}

export function apiAddUseCountOfList(ids: string[]) {
  return http.put(`media/addUseCountOfList`, { data: { ids } })
}
