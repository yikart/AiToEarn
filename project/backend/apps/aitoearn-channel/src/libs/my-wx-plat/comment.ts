export interface ComponentVerifyTicketData {
  AppId: string
  CreateTime: number
  InfoType: 'component_verify_ticket'
  ComponentVerifyTicket: string
}

export interface TicketData {
  AppId: string
  Encrypt: string
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

export interface WxPlat {
  id: string
  secret: string
  token: string
  encodingAESKey: string
  authBackHost: string
}

export interface WxPlatAuthorizerInfo {
  authorizer_appid: string // 授权方 appid
  authorizer_access_token: string // 接口调用令牌（在授权的公众号/小程序具备 API 权限时，才有此返回值）
  expires_in: number // authorizer_access_token 的有效期（在授权的公众号/小程序具备API权限时，才有此返回值），单位：秒
  authorizer_refresh_token: string // 刷新令牌（在
  func_info: {
    funcscope_category: {
      id: number // 1;
    }
  }[]
  errcode?: number
  errmsg?: string
}
