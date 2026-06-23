import type { ChannelPublishRecordOption } from '@/api/channels/channel.types'
import type { PublishStatus } from './publish.constants'
import type { PlatType } from '@/app/config/platConfig'

// Source: plat/types/publish.types.ts


/**
 * PublishRecordItem 数据结构。
 */
export interface PublishRecordItem {
  option: ChannelPublishRecordOption
  userId: string
  flowId: string
  userTaskId: string
  taskId: string
  taskMaterialId: string
  type: string
  title: string
  desc: string
  accountId: string
  topics: string[]
  accountType: PlatType
  uid: string
  videoUrl: string
  coverUrl: string
  imgUrlList: string[]
  publishTime: Date
  status: PublishStatus
  inQueue: boolean
  dataId: string
  workLink: string
  linkStatus?: 'pending' | 'ready' | 'failed'
  linkError?: string
  linkMeta?: Record<string, unknown>
  platformWorkId?: string
  createdAt: string
  updatedAt: string
  id: string
  errorMsg: string
  engagement?: PublishRecordEngagement
}

/**
 * PublishRecordEngagement 类型。
 */
export interface PublishRecordEngagement {
  viewCount: number
  commentCount: number
  likeCount: number
  shareCount: number
  clickCount: number
  impressionCount: number
  favoriteCount: number
}

/**
 * 发布接口响应包装。
 */
export type PublishApiResponse<T> = Awaited<ReturnType<typeof import('@/utils/request').request<T>>>
