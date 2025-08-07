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

// 发布状态，0:成功, 1:发布中，2:原创失败, 3: 常规失败, 4:平台审核不通过, 5:成功后用户删除所有文章, 6: 成功后系统封禁所有文章
export enum WxPublishStatus {
  Success = 0,
  Publishing = 1,
  OriginalFail = 2,
  RegularFail = 3,
  PlatformAuditFail = 4,
  SuccessAfterUserDeleteAllArticle = 5,
  SuccessAfterSystemBanAllArticle = 6,
}
export interface CallbackMsgData {
  appId: string

  // 公众号的ghid
  ToUserName: string
  // 公众号群发助手的openid，为mphelper
  FromUserName: string
  // 创建时间的时间戳
  CreateTime: number
  // 消息类型，此处为event
  MsgType: string
  // 事件信息，此处为PUBLISHJOBFINISH
  Event: string
  // 发布任务id
  publish_id: string
  // 发布状态，0:成功, 1:发布中，2:原创失败, 3: 常规失败, 4:平台审核不通过, 5:成功后用户删除所有文章, 6: 成功后系统封禁所有文章
  publish_status: WxPublishStatus
  // 当发布状态为0时（即成功）时，返回图文的 article_id，可用于“客服消息”场景
  article_id: string
  // 当发布状态为0时（即成功）时，返回文章数量
  count?: number
  // 当发布状态为0时（即成功）时，返回文章对应的编号
  idx?: number
  // 当发布状态为0时（即成功）时，返回图文的永久链接
  article_url?: string
  // 当发布状态为2或4时，返回不通过的文章编号，第一篇为 1；其他发布状态则为空
  fail_idx?: number
}