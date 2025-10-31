import { AccountType } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'

export interface PublishRecordItem {
  dataId: string
  id: string
  flowId: string
  type: string
  title: string
  desc: string
  accountId: string
  accountType: AccountType
  uid: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList: string[]
  publishTime: Date
  status: PublishStatus
  errorMsg: string
  option: any
}

export interface PublishDayInfo {
  userId: string
  publishTotal: number
  createAt: Date
  updatedAt: Date
}
