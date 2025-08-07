// getPublishRecordList 返回值 item，发布记录
import { AccountType } from '../../account/comment'
import { PublishStatus } from '../publish.natsApi'

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
