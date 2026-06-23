import type { PublishStatus } from './publish.constants'
import type { PublishApiResponse, PublishRecordItem } from './publish.types'
import type { ChannelPublicPublishRecordItem, ChannelPublishRecordItem } from '@/api/channels/channel.types'
import type { PlatType } from '@/app/config/platConfig'
import type { IPlatOption } from '@/components/PublishDialog/publishDialog.type'
import { getChannelPublicPublishRecordApi, getChannelPublishFlowApi, getChannelPublishRecordApi } from '@/api/channels/channel.api'

// Source: plat/publish.ts
function normalizeChannelPublishRecord(record: ChannelPublishRecordItem | ChannelPublicPublishRecordItem): PublishRecordItem {
  return {
    option: record.option || {},
    userId: record.userId || '',
    flowId: record.flowId || '',
    userTaskId: record.userTaskId || '',
    taskId: record.taskId || record.id,
    taskMaterialId: record.taskMaterialId || '',
    type: record.type,
    title: record.title || '',
    desc: record.desc || '',
    accountId: record.accountId || '',
    topics: record.topics || [],
    accountType: record.accountType,
    uid: record.uid || '',
    videoUrl: record.videoUrl || '',
    coverUrl: record.coverUrl || '',
    imgUrlList: record.imgUrlList || [],
    publishTime: new Date(record.publishTime),
    status: Number(record.status) as PublishStatus,
    inQueue: record.inQueue || false,
    dataId: record.dataId || record.platformWorkId || '',
    workLink: record.workLink || '',
    linkStatus: record.linkStatus,
    linkError: record.linkError,
    linkMeta: record.linkMeta,
    platformWorkId: record.platformWorkId,
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
    id: record.id,
    errorMsg: record.errorMsg || '',
    engagement: record.engagement,
  }
}

// 根据平台类型过滤option参数
function filterOptionByPlatform(option: IPlatOption, accountType: PlatType): IPlatOption {
  if (!option)
    return {}

  const key = accountType as keyof IPlatOption
  return option[key] ? ({ [key]: option[key] } as IPlatOption) : {}
}

/**
 * 获取发布记录详情
 */
export function getPublishRecordDetail(flowId: string) {
  return getChannelPublishFlowApi(flowId).then(async (flowRes): Promise<PublishApiResponse<PublishRecordItem>> => {
    if (flowRes?.data?.tasks?.[0]?.id) {
      const recordRes = await getChannelPublishRecordApi(flowRes.data.tasks[0].id)
      if (recordRes?.data) {
        return {
          ...recordRes,
          data: normalizeChannelPublishRecord(recordRes.data),
        }
      }
      return recordRes as PublishApiResponse<PublishRecordItem>
    }

    const recordRes = await getChannelPublishRecordApi(flowId)
    if (recordRes?.data) {
      return {
        ...recordRes,
        data: normalizeChannelPublishRecord(recordRes.data),
      }
    }
    return recordRes as PublishApiResponse<PublishRecordItem>
  })
}

/**
 * 根据记录ID获取发布记录详情（公开接口，用于抖音 H5 发布轮询）
 */
export function getPublishRecordDetailById(id: string) {
  return getChannelPublicPublishRecordApi(id).then((res) => {
    if (!res?.data)
      return res as PublishApiResponse<PublishRecordItem>

    return {
      ...res,
      data: normalizeChannelPublishRecord(res.data),
    }
  })
}
