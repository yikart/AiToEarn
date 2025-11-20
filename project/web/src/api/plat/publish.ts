import type {
  GetPublishListParams,
  PublishParams,
  PublishRecordItem,
} from '@/api/plat/types/publish.types'
import type { PlatType } from '@/app/config/platConfig'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { parseTopicString } from '@/utils'
// 创建发布
import { request } from '@/utils/request'

// 根据平台类型过滤option参数
function filterOptionByPlatform(option: IPlatOption, accountType: PlatType): IPlatOption {
  if (!option)
    return {}
  const key = accountType as keyof IPlatOption
  return option[key] ? ({ [key]: option[key] } as IPlatOption) : {}
}

// 创建发布
export function apiCreatePublish(data: PublishParams) {
  const { topics, cleanedString } = parseTopicString(data.desc || '')
  data.topics = [...new Set(data.topics?.concat(topics))]
  data.desc = cleanedString

  // 根据accountType过滤option参数
  data.option = filterOptionByPlatform(data.option, data.accountType)

  return request({
    url: 'plat/publish/create',
    method: 'POST',
    data,
  })
}

// 查询发布列表
export function getPublishList(data: GetPublishListParams) {
  return request<PublishRecordItem[]>({
    url: 'plat/publish/posts',
    method: 'POST',
    data,
  })
}

// 查询发布队列（列表模式使用的新接口）
export function getPublishQueue(data: any) {
  return request<PublishRecordItem[]>({
    url: 'plat/publish/statuses/queued/posts',
    method: 'POST',
    data,
  })
}

// 修改发布任务时间
export function updatePublishRecordTimeApi(data: {
  id: string
  publishTime: string
}) {
  return request({
    url: 'plat/publish/updateTaskTime',
    method: 'POST',
    data,
  })
}

// 删除发布任务
export function deletePublishRecordApi(id: string) {
  return request({
    url: `plat/publish/delete/${id}`,
    method: 'DELETE',
  })
}

// 立即发布任务
export function nowPubTaskApi(id: string) {
  return request({
    url: `plat/publish/nowPubTask/${id}`,
    method: 'POST',
  })
}

// 获取发布记录详情
export function getPublishRecordDetail(flowId: string) {
  return request<PublishRecordItem>({
    url: `plat/publish/records/${flowId}`,
    method: 'GET',
  })
}
