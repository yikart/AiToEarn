export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface BClient {
  clientName: string
  clientId: string
  clientSecret: string
  authBackUrl: string
}

export interface AddArchiveData {
  title: string // 标题
  cover?: string // 封面url
  tid: number // 分区ID，由获取分区信息接口得到
  no_reprint?: 0 | 1 // 是否允许转载 0-允许，1-不允许。默认0
  desc?: string // 描述
  tag: string // 标签, 多个标签用英文逗号分隔，总长度小于200
  copyright: 1 | 2 // 1-原创，2-转载(转载时source必填)
  source?: string // 如果copyright为转载，则此字段表示转载来源
  topic_id?: number // 参加的话题ID，默认情况下不填写，需要填写和运营联系
}
