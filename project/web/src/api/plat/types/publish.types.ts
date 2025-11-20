import type { PlatType } from '@/app/config/platConfig'
import type { PubType } from '@/app/config/publishConfig'

export enum PublishStatus {
  FAIL = -1, // 发布失败
  UNPUBLISH = 0, // 未发布
  RELEASED = 1, // 已发布
  PUB_LOADING = 2, // 发布中
}

// 创建发布入参
export interface PublishParams {
  // 传入账号UID
  flowId: string
  type: PubType
  title: string
  desc?: string
  // 传入 account
  accountId: string
  accountType: PlatType
  videoUrl?: string
  coverUrl?: string
  // 图片列表
  imgUrlList?: string[]
  // 话题
  topics?: string[]
  publishTime?: string
  option?: any
  userTaskId?: string
  materialId?: string
}

// 查询发布列表入参
export interface GetPublishListParams {
  accountId?: string
  accountType?: PlatType
  type?: PubType
  status?: PublishStatus
  time?: [string, string]
  // internal=平台发布，native=原生发布 不转则为混合
  publishingChannel?: 'internal' | 'native'
}

// 发布记录item数据
export interface PublishRecordItem {
  option: any
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
  createdAt: string
  updatedAt: string
  id: string
  errorMsg: string
  engagement?: PublishRecordEngagement
}

export interface PublishRecordEngagement {
  viewCount: number
  commentCount: number
  likeCount: number
  shareCount: number
  clickCount: number
  impressionCount: number
  favoriteCount: number
}
