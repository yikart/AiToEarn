import { AccountType } from '@yikart/common'

export enum PublishType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article',
}

export enum PublishStatus {
  FAILED = -1, // 发布失败
  WaitingForPublish = 0, // 未发布
  PUBLISHED = 1, // 已发布
  PUBLISHING = 2, // 发布中
}

export interface PublishRecord {
  id: string
  userId: string
  flowId?: string // 前端传入的流水ID
  userTaskId?: string // 用户任务ID
  type: PublishType
  title?: string
  desc?: string // 主要内容
  accountId: string
  topics: string[]
  accountType: AccountType
  uid: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  publishTime: Date
  status: PublishStatus
  queueId?: string
  inQueue: boolean
  errorMsg?: string
  option?: any
  dataId: string // 微信公众号-publish_id
  workLink?: string // 作品链接
  dataOption?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export enum PublishingChannel {
  INTERNAL = 'internal', // 通过我们内部系统发布的
  NATIVE = 'native', // 平台原生端发布的
}
